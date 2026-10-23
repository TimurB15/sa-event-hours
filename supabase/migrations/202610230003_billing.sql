-- One invoice per job prevents multiplying a job minimum by its worker count.
alter table public.customers add column billing_basis text not null default 'job' check(billing_basis in ('job','worker_shift'));
alter table public.jobs add column billing_basis text not null default 'job' check(billing_basis in ('job','worker_shift'));
create table public.invoices (
 id uuid primary key default gen_random_uuid(), organization_id uuid not null, job_id uuid not null,
 amount_agorot bigint not null check(amount_agorot>=0), status text not null check(status in ('estimate','approved')),
 version integer not null default 1, updated_at timestamptz not null default now(),
 unique(job_id), foreign key(organization_id,job_id) references public.jobs(organization_id,id)
);
alter table public.invoices enable row level security;
create policy invoice_read on public.invoices for select to authenticated using(is_manager(organization_id));
revoke all on public.invoices from anon,authenticated; grant select on public.invoices to authenticated;
-- Hide customer financial policy and billing calculations from workers at the column grant level.
revoke select on public.jobs,public.timesheets from authenticated;
grant select(id,organization_id,customer_id,title,address,business_date,planned_start,planned_end,required_workers,status,contact_name,contact_phone,notes,vehicle_id,checklist,version,created_at,updated_at) on public.jobs to authenticated;
grant select(id,organization_id,assignment_id,actual_start,actual_end,break_minutes,status,worked_minutes,wage_agorot,correction_note,approved_by,approved_at,version) on public.timesheets to authenticated;
create function public.refresh_invoice() returns trigger language plpgsql security definer set search_path=public as $$
 declare v_job jobs; v_minutes numeric; v_base bigint; v_extras bigint; v_pending integer; v_count integer;
 begin
 select j.* into v_job from jobs j join job_assignments a on a.job_id=j.id where a.id=new.assignment_id for update of j;
 select count(*) into v_pending from job_assignments a left join timesheets t on t.assignment_id=a.id where a.job_id=v_job.id and a.status!='cancelled' and (t.status is null or t.status!='approved');
 select count(*) into v_count from timesheets t join job_assignments a on a.id=t.assignment_id where a.job_id=v_job.id and t.status='approved';
 if v_count=0 then update invoices set amount_agorot=0,status='estimate',version=version+1,updated_at=now() where job_id=v_job.id; return new; end if;
 if v_job.billing_basis='worker_shift' then
  select sum(t.billed_agorot) into v_base from timesheets t join job_assignments a on a.id=t.assignment_id where a.job_id=v_job.id and t.status='approved';
 else
  select max(t.worked_minutes) into v_minutes from timesheets t join job_assignments a on a.id=t.assignment_id where a.job_id=v_job.id and t.status='approved';
  v_base:=case v_job.billing_kind when 'fixed' then v_job.billing_fixed_agorot when 'minimum' then greatest(v_job.billing_minimum_agorot,round(v_minutes*v_job.billing_rate_agorot/60)) else round(v_minutes*v_job.billing_rate_agorot/60) end;
 end if;
 select coalesce(sum(amount_agorot),0) into v_extras from adjustments where job_id=v_job.id and direction='customer_charge';
 insert into invoices(organization_id,job_id,amount_agorot,status) values(v_job.organization_id,v_job.id,v_base+v_extras,case when v_pending=0 then 'approved' else 'estimate' end)
 on conflict(job_id) do update set amount_agorot=excluded.amount_agorot,status=excluded.status,version=invoices.version+1,updated_at=now();
 if v_pending=0 then update jobs set status='approved',version=version+1,updated_at=now() where id=v_job.id; end if;
 return new; end
$$;
create trigger refresh_invoice_after_approval after update of status on public.timesheets for each row execute function public.refresh_invoice();
create or replace function public.record_payment(p_id uuid,p_timesheet uuid,p_direction text,p_amount bigint,p_reference text default '') returns void language plpgsql security definer set search_path=public as $$
 declare v timesheets; v_paid bigint; v_limit bigint; v_existing payments; v_job uuid; v_org uuid;
 begin
 select a.job_id,a.organization_id into v_job,v_org from job_assignments a join timesheets t on t.assignment_id=a.id where t.id=p_timesheet;
 perform require_manager(v_org);
 perform 1 from jobs where id=v_job for update;
 select * into v from timesheets where id=p_timesheet for update;
 select * into v_existing from payments where id=p_id;
 if found then
 if v_existing.timesheet_id=p_timesheet and v_existing.direction=p_direction and v_existing.amount_agorot=p_amount and v_existing.organization_id=v.organization_id then return; end if;
 raise exception 'Idempotency key reused with different payment'; end if;
 if v.status!='approved' or p_amount is null or p_amount<=0 or p_direction not in ('customer_receipt','worker_payment') then raise exception 'Invalid payment'; end if;
 if p_direction='worker_payment' then
  v_limit:=v.wage_agorot;
  select coalesce(sum(amount_agorot),0) into v_paid from payments where timesheet_id=p_timesheet and direction=p_direction;
 else
  select amount_agorot into v_limit from invoices where job_id=v_job and status='approved';
  if v_limit is null then raise exception 'Invoice still awaiting approved hours'; end if;
  select coalesce(sum(p.amount_agorot),0) into v_paid from payments p join timesheets t on t.id=p.timesheet_id join job_assignments a on a.id=t.assignment_id where a.job_id=v_job and p.direction=p_direction;
 end if;
 if p_amount+v_paid>v_limit then raise exception 'Payment exceeds balance'; end if;
 insert into payments values(p_id,v.organization_id,p_timesheet,p_direction,p_amount,p_reference,now());
 perform audit_change(v.organization_id,'payment_recorded',p_id,jsonb_build_object('amount_agorot',p_amount,'direction',p_direction)); end
$$;
create function public.record_adjustment(p_id uuid,p_job uuid,p_source text,p_kind text,p_direction text,p_amount integer,p_employee uuid default null) returns void language plpgsql security definer set search_path=public as $$
 declare v jobs; begin
 select * into v from jobs where id=p_job for update; perform require_manager(v.organization_id);
 if exists(select 1 from invoices where job_id=p_job) then raise exception 'Record adjustments before timesheet approval'; end if;
 insert into adjustments(id,organization_id,job_id,source_id,kind,direction,employee_id,amount_agorot) values(p_id,v.organization_id,p_job,p_source,p_kind,p_direction,p_employee,p_amount);
 perform audit_change(v.organization_id,'adjustment_recorded',p_id); end
$$;
create function public.edit_job(p_job uuid,p_version integer,p_title text,p_address text,p_phone text,p_notes text) returns void language plpgsql security definer set search_path=public as $$
 declare v jobs; begin
 select * into v from jobs where id=p_job for update; perform require_manager(v.organization_id);
 if v.version!=p_version or v.status in ('cancelled','completed') then raise exception 'Job changed or closed'; end if;
 update jobs set title=trim(p_title),address=p_address,contact_phone=p_phone,notes=p_notes,version=version+1,updated_at=now() where id=p_job;
 insert into notifications(organization_id,user_id,message) select v.organization_id,e.user_id,'פרטי העבודה עודכנו: '||p_title from job_assignments a join employees e on e.id=a.employee_id where a.job_id=p_job and e.user_id is not null;
 perform audit_change(v.organization_id,'job_edited',p_job,jsonb_build_object('before',to_jsonb(v))); end
$$;
revoke execute on function public.refresh_invoice(),public.record_adjustment(uuid,uuid,text,text,text,integer,uuid),public.edit_job(uuid,integer,text,text,text,text) from public,anon,authenticated;
grant execute on function public.record_adjustment(uuid,uuid,text,text,text,integer,uuid),public.edit_job(uuid,integer,text,text,text,text) to authenticated;
