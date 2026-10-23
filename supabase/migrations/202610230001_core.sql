-- SA Event Logistics: organization isolation and server-authorized operations.
-- Apply to a fresh Supabase project. No legacy data is imported automatically.
create table public.organizations (
 id uuid primary key default gen_random_uuid(), name text not null check(length(trim(name)) between 1 and 150), created_at timestamptz not null default now()
);
create table public.organization_members (
 organization_id uuid not null references public.organizations, user_id uuid not null references auth.users,
 role text not null check(role in ('owner','manager','worker')), display_name text not null,
 primary key(organization_id,user_id)
);
create table public.employees (
 id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations,
 user_id uuid references auth.users, name text not null check(length(trim(name)) between 1 and 150),
 rate_agorot integer not null default 5000 check(rate_agorot between 0 and 10000000), archived boolean not null default false,
 unique(organization_id,id), unique(organization_id,user_id)
);
create table public.customers (
 id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations,
 name text not null check(length(trim(name)) between 1 and 150),
 billing_kind text not null default 'hourly' check(billing_kind in ('hourly','minimum','fixed')),
 rate_agorot integer not null default 6500 check(rate_agorot between 0 and 10000000),
 minimum_agorot integer not null default 0 check(minimum_agorot>=0), fixed_agorot integer not null default 0 check(fixed_agorot>=0),
 archived boolean not null default false, unique(organization_id,id)
);
create table public.vehicles (
 id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations,
 label text not null, registration text not null default '', archived boolean not null default false, unique(organization_id,id)
);
create table public.jobs (
 id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations,
 customer_id uuid not null, title text not null check(length(trim(title)) between 1 and 200), address text not null default '',
 business_date date not null, planned_start timestamptz, planned_end timestamptz,
 required_workers integer not null default 1 check(required_workers between 1 and 200),
 status text not null default 'published' check(status in ('draft','published','assigned','in_progress','submitted','approved','completed','cancelled')),
 contact_name text not null default '', contact_phone text not null default '', notes text not null default '',
 vehicle_id uuid, checklist jsonb not null default '[]', version integer not null default 1,
 billing_kind text not null, billing_rate_agorot integer not null, billing_minimum_agorot integer not null, billing_fixed_agorot integer not null,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 unique(organization_id,id), foreign key(organization_id,customer_id) references public.customers(organization_id,id),
 foreign key(organization_id,vehicle_id) references public.vehicles(organization_id,id),
 check(planned_end is null or (planned_start is not null and planned_end>planned_start))
);
create table public.job_assignments (
 id uuid primary key default gen_random_uuid(), organization_id uuid not null, job_id uuid not null, employee_id uuid not null,
 status text not null default 'claimed' check(status in ('assigned','claimed','accepted','active','submitted','approved','cancelled')),
 rate_agorot integer not null check(rate_agorot>=0), created_at timestamptz not null default now(),
 unique(organization_id,id), unique(job_id,employee_id),
 foreign key(organization_id,job_id) references public.jobs(organization_id,id),
 foreign key(organization_id,employee_id) references public.employees(organization_id,id)
);
create table public.timesheets (
 id uuid primary key default gen_random_uuid(), organization_id uuid not null, assignment_id uuid not null,
 actual_start timestamptz not null, actual_end timestamptz, break_minutes integer not null default 0 check(break_minutes>=0),
 status text not null default 'active' check(status in ('active','submitted','approved','rejected')),
 worked_minutes integer, wage_agorot bigint, billed_agorot bigint,
 correction_note text not null default '', approved_by uuid references auth.users, approved_at timestamptz,
 version integer not null default 1, unique(assignment_id), unique(organization_id,id),
 foreign key(organization_id,assignment_id) references public.job_assignments(organization_id,id),
 check(actual_end is null or actual_end>actual_start), check(worked_minutes is null or worked_minutes between 1 and 1440)
);
create table public.timesheet_approvals (
 id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations,
 timesheet_id uuid not null references public.timesheets, actor_id uuid not null references auth.users,
 decision text not null check(decision in ('approved','rejected','correction_requested')), note text not null default '', created_at timestamptz not null default now()
);
create table public.adjustments (
 id uuid primary key default gen_random_uuid(), organization_id uuid not null, job_id uuid not null,
 source_id text not null check(length(trim(source_id))>0), kind text not null check(kind in ('fuel','transport','bonus','additional_worker')),
 direction text not null check(direction in ('customer_charge','worker_reimbursement','business_expense')),
 employee_id uuid, amount_agorot integer not null check(amount_agorot>0), created_at timestamptz not null default now(),
 unique(organization_id,source_id), foreign key(organization_id,job_id) references public.jobs(organization_id,id),
 foreign key(organization_id,employee_id) references public.employees(organization_id,id),
 check(direction!='worker_reimbursement' or employee_id is not null)
);
create table public.payments (
 id uuid primary key, organization_id uuid not null references public.organizations,
 timesheet_id uuid not null, direction text not null check(direction in ('customer_receipt','worker_payment')),
 amount_agorot bigint not null check(amount_agorot>0), reference text not null default '', created_at timestamptz not null default now(),
 foreign key(organization_id,timesheet_id) references public.timesheets(organization_id,id)
);
create table public.notifications (
 id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations,
 user_id uuid not null references auth.users, message text not null, created_at timestamptz not null default now(), read_at timestamptz
);
create table public.audit_logs (
 id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations,
 actor_id uuid references auth.users, action text not null, record_id uuid, detail jsonb not null default '{}', created_at timestamptz not null default now()
);
create table public.invitations (
 token uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations,
 email text not null, role text not null check(role in ('manager','worker')), employee_id uuid not null,
 expires_at timestamptz not null default now()+interval '7 days', redeemed_by uuid references auth.users,
 foreign key(organization_id,employee_id) references public.employees(organization_id,id)
);
create table public.legacy_imports (
 organization_id uuid not null references public.organizations, source_key text not null, imported_by uuid not null references auth.users,
 backup jsonb not null, created_at timestamptz not null default now(), primary key(organization_id,source_key)
);
create index jobs_schedule on public.jobs(organization_id,business_date);
create index assignments_employee on public.job_assignments(organization_id,employee_id);
create index timesheets_org_status on public.timesheets(organization_id,status);
create index notifications_recipient on public.notifications(user_id,created_at desc);
create index payments_timesheet on public.payments(timesheet_id,direction);

create function public.member_role(p_org uuid) returns text language sql stable security definer set search_path=public as $$
 select role from organization_members where organization_id=p_org and user_id=auth.uid()
$$;
create function public.is_manager(p_org uuid) returns boolean language sql stable security definer set search_path=public as $$
 select coalesce(member_role(p_org) in ('owner','manager'),false)
$$;
create function public.owns_assignment(p_assignment uuid) returns boolean language sql stable security definer set search_path=public as $$
 select exists(select 1 from job_assignments a join employees e on e.id=a.employee_id where a.id=p_assignment and e.user_id=auth.uid() and member_role(a.organization_id) is not null)
$$;
create function public.require_manager(p_org uuid) returns void language plpgsql security definer set search_path=public as $$
 begin if not is_manager(p_org) then raise exception 'Manager permission required'; end if; end
$$;
create function public.audit_change(p_org uuid,p_action text,p_record uuid,p_detail jsonb default '{}') returns void language sql security definer set search_path=public as $$
 insert into audit_logs(organization_id,actor_id,action,record_id,detail) values(p_org,auth.uid(),p_action,p_record,p_detail)
$$;

alter table public.organizations enable row level security;
create policy org_read on public.organizations for select to authenticated using(member_role(id) is not null);
alter table public.organization_members enable row level security;
create policy member_read on public.organization_members for select to authenticated using(user_id=auth.uid() or is_manager(organization_id));
alter table public.employees enable row level security;
create policy employee_read on public.employees for select to authenticated using(is_manager(organization_id) or (user_id=auth.uid() and member_role(organization_id) is not null));
alter table public.customers enable row level security;
create policy customer_read on public.customers for select to authenticated using(is_manager(organization_id));
alter table public.vehicles enable row level security;
create policy vehicle_read on public.vehicles for select to authenticated using(member_role(organization_id) is not null);
alter table public.jobs enable row level security;
create policy job_read on public.jobs for select to authenticated using(is_manager(organization_id) or (member_role(organization_id) is not null and (status in ('published','assigned') or exists(select 1 from job_assignments a where a.job_id=jobs.id and owns_assignment(a.id)))));
alter table public.job_assignments enable row level security;
create policy assignment_read on public.job_assignments for select to authenticated using(is_manager(organization_id) or owns_assignment(id));
alter table public.timesheets enable row level security;
create policy timesheet_read on public.timesheets for select to authenticated using(is_manager(organization_id) or owns_assignment(assignment_id));
alter table public.timesheet_approvals enable row level security;
create policy approval_read on public.timesheet_approvals for select to authenticated using(is_manager(organization_id) or exists(select 1 from timesheets t where t.id=timesheet_id and owns_assignment(t.assignment_id)));
alter table public.adjustments enable row level security;
create policy adjustment_read on public.adjustments for select to authenticated using(is_manager(organization_id) or (direction='worker_reimbursement' and employee_id in (select id from employees where user_id=auth.uid())));
alter table public.payments enable row level security;
create policy payment_read on public.payments for select to authenticated using(is_manager(organization_id) or (direction='worker_payment' and exists(select 1 from timesheets t where t.id=timesheet_id and owns_assignment(t.assignment_id))));
alter table public.notifications enable row level security;
create policy notification_read on public.notifications for select to authenticated using(user_id=auth.uid() and member_role(organization_id) is not null);
alter table public.audit_logs enable row level security;
create policy audit_read on public.audit_logs for select to authenticated using(is_manager(organization_id));
alter table public.invitations enable row level security;
create policy invite_read on public.invitations for select to authenticated using(member_role(organization_id)='owner');
alter table public.legacy_imports enable row level security;
create policy import_read on public.legacy_imports for select to authenticated using(member_role(organization_id)='owner');

create function public.create_organization(p_name text,p_display_name text) returns uuid language plpgsql security definer set search_path=public as $$
 declare v_org uuid; begin
 if auth.uid() is null then raise exception 'Login required'; end if;
 insert into organizations(name) values(trim(p_name)) returning id into v_org;
 insert into organization_members values(v_org,auth.uid(),'owner',trim(p_display_name));
 insert into employees(organization_id,user_id,name) values(v_org,auth.uid(),trim(p_display_name));
 return v_org; end
$$;
create function public.save_customer(p_org uuid,p_name text,p_kind text default 'hourly',p_rate integer default 6500,p_minimum integer default 0,p_fixed integer default 0) returns uuid language plpgsql security definer set search_path=public as $$
 declare v_id uuid; begin perform require_manager(p_org);
 insert into customers(organization_id,name,billing_kind,rate_agorot,minimum_agorot,fixed_agorot) values(p_org,trim(p_name),p_kind,p_rate,p_minimum,p_fixed) returning id into v_id;
 perform audit_change(p_org,'customer_created',v_id); return v_id; end
$$;
create function public.invite_worker(p_org uuid,p_email text,p_name text,p_rate integer default 5000,p_role text default 'worker') returns uuid language plpgsql security definer set search_path=public as $$
 declare v_employee uuid; v_token uuid; begin
 if member_role(p_org)!='owner' or member_role(p_org) is null then raise exception 'Owner permission required'; end if;
 if p_email not like '%@%' then raise exception 'Invalid email'; end if;
 insert into employees(organization_id,name,rate_agorot) values(p_org,trim(p_name),p_rate) returning id into v_employee;
 insert into invitations(organization_id,email,role,employee_id) values(p_org,lower(trim(p_email)),p_role,v_employee) returning token into v_token;
 perform audit_change(p_org,'invitation_created',v_employee); return v_token; end
$$;
create function public.accept_invitation(p_token uuid) returns uuid language plpgsql security definer set search_path=public as $$
 declare v invitations; begin
 select * into v from invitations where token=p_token for update;
 if not found or v.expires_at<now() or v.redeemed_by is not null or lower(coalesce(auth.jwt()->>'email',''))!=v.email then raise exception 'Invitation invalid or expired'; end if;
 insert into organization_members values(v.organization_id,auth.uid(),v.role,(select name from employees where id=v.employee_id));
 update employees set user_id=auth.uid() where id=v.employee_id;
 update invitations set redeemed_by=auth.uid() where token=p_token;
 perform audit_change(v.organization_id,'invitation_accepted',v.employee_id); return v.organization_id; end
$$;
create function public.publish_job(p_org uuid,p_customer uuid,p_title text,p_date date,p_address text default '',p_start timestamptz default null,p_end timestamptz default null,p_workers integer default 1,p_phone text default '',p_notes text default '') returns uuid language plpgsql security definer set search_path=public as $$
 declare v_customer customers; v_job uuid; begin perform require_manager(p_org);
 select * into v_customer from customers where id=p_customer and organization_id=p_org and not archived;
 if not found then raise exception 'Customer unavailable'; end if;
 insert into jobs(organization_id,customer_id,title,business_date,address,planned_start,planned_end,required_workers,contact_phone,notes,billing_kind,billing_rate_agorot,billing_minimum_agorot,billing_fixed_agorot)
 values(p_org,p_customer,trim(p_title),p_date,p_address,p_start,p_end,p_workers,p_phone,p_notes,v_customer.billing_kind,v_customer.rate_agorot,v_customer.minimum_agorot,v_customer.fixed_agorot) returning id into v_job;
 insert into notifications(organization_id,user_id,message) select p_org,user_id,'עבודה חדשה: '||p_title from organization_members where organization_id=p_org and role='worker';
 perform audit_change(p_org,'job_published',v_job); return v_job; end
$$;
create function public.claim_job(p_job uuid,p_employee uuid default null) returns uuid language plpgsql security definer set search_path=public as $$
 declare v_job jobs; v_employee employees; v_assignment job_assignments; v_count integer; begin
 select * into v_job from jobs where id=p_job for update;
 if not found or member_role(v_job.organization_id) is null then raise exception 'Job unavailable'; end if;
 select * into v_employee from employees where organization_id=v_job.organization_id and not archived and ((p_employee is null and user_id=auth.uid()) or (id=p_employee and is_manager(v_job.organization_id)));
 if not found then raise exception 'Employee unavailable'; end if;
 select * into v_assignment from job_assignments where job_id=p_job and employee_id=v_employee.id;
 if found and v_assignment.status!='cancelled' then return v_assignment.id; end if;
 if v_job.status not in ('published','assigned') then raise exception 'Job unavailable'; end if;
 select count(*) into v_count from job_assignments where job_id=p_job and status!='cancelled';
 if v_count>=v_job.required_workers then raise exception 'No remaining slots'; end if;
 insert into job_assignments(organization_id,job_id,employee_id,rate_agorot,status) values(v_job.organization_id,p_job,v_employee.id,v_employee.rate_agorot,case when p_employee is null then 'claimed' else 'assigned' end)
 on conflict(job_id,employee_id) do update set status=excluded.status,rate_agorot=excluded.rate_agorot returning * into v_assignment;
 update jobs set status='assigned',version=version+1,updated_at=now() where id=p_job;
 insert into notifications(organization_id,user_id,message) select v_job.organization_id,user_id,'עובד שובץ: '||v_job.title from organization_members where organization_id=v_job.organization_id and role in ('owner','manager');
 if v_employee.user_id is not null then insert into notifications(organization_id,user_id,message) values(v_job.organization_id,v_employee.user_id,'שובצת לעבודה: '||v_job.title); end if;
 perform audit_change(v_job.organization_id,'job_claimed',v_assignment.id); return v_assignment.id; end
$$;
create function public.start_shift(p_assignment uuid) returns uuid language plpgsql security definer set search_path=public as $$
 declare v job_assignments; v_id uuid; v_job jobs; begin
 select j.* into v_job from jobs j join job_assignments a on a.job_id=j.id where a.id=p_assignment for update of j;
 select * into v from job_assignments where id=p_assignment for update;
 if not found or not (owns_assignment(p_assignment) or is_manager(v.organization_id)) or v.status='cancelled' or v_job.status='cancelled' then raise exception 'Assignment unavailable'; end if;
 select id into v_id from timesheets where assignment_id=p_assignment;
 if v_id is not null then return v_id; end if;
 insert into timesheets(organization_id,assignment_id,actual_start) values(v.organization_id,p_assignment,now()) returning id into v_id;
 update job_assignments set status='active' where id=p_assignment;
 update jobs set status='in_progress',version=version+1,updated_at=now() where id=v.job_id;
 perform audit_change(v.organization_id,'shift_started',v_id); return v_id; end
$$;
create function public.submit_timesheet(p_timesheet uuid,p_version integer,p_break integer default 0,p_note text default '') returns void language plpgsql security definer set search_path=public as $$
 declare v timesheets; v_end timestamptz; v_minutes integer; begin
 select * into v from timesheets where id=p_timesheet for update;
 if not found or not (owns_assignment(v.assignment_id) or is_manager(v.organization_id)) then raise exception 'Permission denied'; end if;
 if v.version!=p_version then raise exception 'Changed on another device; refresh'; end if;
 if v.status!='active' then raise exception 'Shift is not active'; end if;
 v_end:=now(); v_minutes:=floor(extract(epoch from (v_end-v.actual_start))/60)::integer-p_break;
 if p_break<0 or v_minutes not between 1 and 1440 then raise exception 'Invalid worked duration'; end if;
 update timesheets set actual_end=v_end,break_minutes=p_break,worked_minutes=v_minutes,status='submitted',correction_note=p_note,version=version+1 where id=p_timesheet;
 update job_assignments set status='submitted' where id=v.assignment_id;
 insert into notifications(organization_id,user_id,message) select v.organization_id,user_id,'דיווח שעות ממתין לאישור' from organization_members where organization_id=v.organization_id and role in ('owner','manager');
 perform audit_change(v.organization_id,'timesheet_submitted',p_timesheet); end
$$;
create function public.review_timesheet(p_timesheet uuid,p_version integer,p_approve boolean,p_note text default '') returns void language plpgsql security definer set search_path=public as $$
 declare v timesheets; v_a job_assignments; v_j jobs; v_bill bigint; v_wage bigint; begin
 select * into v from timesheets where id=p_timesheet for update; perform require_manager(v.organization_id);
 if v.version!=p_version or v.status!='submitted' then raise exception 'Timesheet changed or not submitted'; end if;
 select * into v_a from job_assignments where id=v.assignment_id;
 select * into v_j from jobs where id=v_a.job_id;
 v_wage:=round(v.worked_minutes::numeric*v_a.rate_agorot/60);
 v_bill:=case v_j.billing_kind when 'fixed' then v_j.billing_fixed_agorot when 'minimum' then greatest(v_j.billing_minimum_agorot,round(v.worked_minutes::numeric*v_j.billing_rate_agorot/60)) else round(v.worked_minutes::numeric*v_j.billing_rate_agorot/60) end;
 update timesheets set status=case when p_approve then 'approved' else 'rejected' end,wage_agorot=case when p_approve then v_wage end,billed_agorot=case when p_approve then v_bill end,approved_by=auth.uid(),approved_at=now(),version=version+1 where id=p_timesheet;
 update job_assignments set status=case when p_approve then 'approved' else 'submitted' end where id=v.assignment_id;
 insert into timesheet_approvals(organization_id,timesheet_id,actor_id,decision,note) values(v.organization_id,p_timesheet,auth.uid(),case when p_approve then 'approved' else 'rejected' end,p_note);
 insert into notifications(organization_id,user_id,message) select v.organization_id,user_id,case when p_approve then 'דיווח השעות אושר' else 'דיווח השעות נדחה: '||p_note end from employees where id=v_a.employee_id and user_id is not null;
 perform audit_change(v.organization_id,'timesheet_reviewed',p_timesheet,jsonb_build_object('before',to_jsonb(v),'approved',p_approve,'note',p_note)); end
$$;
create function public.correct_timesheet(p_timesheet uuid,p_version integer,p_start timestamptz,p_end timestamptz,p_break integer,p_note text) returns void language plpgsql security definer set search_path=public as $$
 declare v timesheets; v_minutes integer; begin
 select * into v from timesheets where id=p_timesheet for update;
 if not found or not (owns_assignment(v.assignment_id) or is_manager(v.organization_id)) then raise exception 'Permission denied'; end if;
 if v.version!=p_version or v.status not in ('submitted','rejected','approved') then raise exception 'Timesheet changed'; end if;
 if exists(select 1 from payments p join timesheets t on t.id=p.timesheet_id join job_assignments a on a.id=t.assignment_id where a.job_id=(select job_id from job_assignments where id=v.assignment_id)) then raise exception 'Reconcile existing payments before correction'; end if;
 v_minutes:=floor(extract(epoch from (p_end-p_start))/60)::integer-p_break;
 if p_break<0 or v_minutes not between 1 and 1440 or length(trim(p_note))=0 then raise exception 'Invalid correction'; end if;
 update timesheets set actual_start=p_start,actual_end=p_end,break_minutes=p_break,worked_minutes=v_minutes,correction_note=p_note,status='submitted',wage_agorot=null,billed_agorot=null,approved_by=null,approved_at=null,version=version+1 where id=p_timesheet;
 insert into timesheet_approvals(organization_id,timesheet_id,actor_id,decision,note) values(v.organization_id,p_timesheet,auth.uid(),'correction_requested',p_note);
 perform audit_change(v.organization_id,'timesheet_corrected',p_timesheet,jsonb_build_object('before',to_jsonb(v),'note',p_note)); end
$$;
create function public.record_payment(p_id uuid,p_timesheet uuid,p_direction text,p_amount bigint,p_reference text default '') returns void language plpgsql security definer set search_path=public as $$
 declare v timesheets; v_paid bigint; v_limit bigint; v_existing payments; begin
 select * into v from timesheets where id=p_timesheet for update; perform require_manager(v.organization_id);
 select * into v_existing from payments where id=p_id;
 if found then
 if v_existing.timesheet_id=p_timesheet and v_existing.direction=p_direction and v_existing.amount_agorot=p_amount and v_existing.organization_id=v.organization_id then return; end if;
 raise exception 'Idempotency key reused with different payment'; end if;
 if v.status!='approved' or p_amount<=0 or p_direction not in ('customer_receipt','worker_payment') then raise exception 'Invalid payment'; end if;
 v_limit:=case when p_direction='worker_payment' then v.wage_agorot else v.billed_agorot end;
 select coalesce(sum(amount_agorot),0) into v_paid from payments where timesheet_id=p_timesheet and direction=p_direction;
 if p_amount+v_paid>v_limit then raise exception 'Payment exceeds balance'; end if;
 insert into payments values(p_id,v.organization_id,p_timesheet,p_direction,p_amount,p_reference,now());
 perform audit_change(v.organization_id,'payment_recorded',p_id,jsonb_build_object('amount_agorot',p_amount,'direction',p_direction)); end
$$;
create function public.cancel_job(p_job uuid,p_version integer) returns void language plpgsql security definer set search_path=public as $$
 declare v jobs; begin select * into v from jobs where id=p_job for update; perform require_manager(v.organization_id);
 if v.version!=p_version then raise exception 'Job changed; refresh'; end if;
 if exists(select 1 from timesheets t join job_assignments a on a.id=t.assignment_id where a.job_id=p_job) then raise exception 'Reconcile started shifts before cancellation'; end if;
 update jobs set status='cancelled',version=version+1,updated_at=now() where id=p_job;
 insert into notifications(organization_id,user_id,message) select v.organization_id,e.user_id,'העבודה בוטלה: '||v.title from employees e join job_assignments a on a.employee_id=e.id where a.job_id=p_job and e.user_id is not null;
 update job_assignments set status='cancelled' where job_id=p_job;
 perform audit_change(v.organization_id,'job_cancelled',p_job); end
$$;
create function public.mark_notifications_read(p_org uuid) returns void language sql security definer set search_path=public as $$
 update notifications set read_at=now() where organization_id=p_org and user_id=auth.uid() and member_role(p_org) is not null and read_at is null
$$;
-- Only RPCs mutate business data. No client INSERT/UPDATE/DELETE grants.
revoke all on all tables in schema public from anon, authenticated;
grant select on all tables in schema public to authenticated;
revoke execute on all functions in schema public from public,anon,authenticated;
grant execute on function public.member_role(uuid),public.is_manager(uuid),public.owns_assignment(uuid) to authenticated;
grant execute on function public.create_organization(text,text),public.save_customer(uuid,text,text,integer,integer,integer),public.invite_worker(uuid,text,text,integer,text),public.accept_invitation(uuid),public.publish_job(uuid,uuid,text,date,text,timestamptz,timestamptz,integer,text,text),public.claim_job(uuid,uuid),public.start_shift(uuid),public.submit_timesheet(uuid,integer,integer,text),public.review_timesheet(uuid,integer,boolean,text),public.correct_timesheet(uuid,integer,timestamptz,timestamptz,integer,text),public.record_payment(uuid,uuid,text,bigint,text),public.cancel_job(uuid,integer),public.mark_notifications_read(uuid) to authenticated;
