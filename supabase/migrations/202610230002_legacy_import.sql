-- Source IDs are preserved in a mapping table. Entire import is one transaction.
create table public.legacy_record_map (
 organization_id uuid not null references public.organizations,
 kind text not null check(kind in ('employee','customer','shift','job')), legacy_id text not null,
 target_id uuid not null, primary key(organization_id,kind,legacy_id)
);
alter table public.legacy_record_map enable row level security;
create policy map_read on public.legacy_record_map for select to authenticated using(member_role(organization_id)='owner');
revoke all on public.legacy_record_map from anon,authenticated;
grant select on public.legacy_record_map to authenticated;

create function public.import_legacy(p_org uuid,p_payload jsonb) returns jsonb language plpgsql security definer set search_path=public as $$
 declare v jsonb; v_id uuid; v_emp uuid; v_customer uuid; v_job uuid; v_assignment uuid; v_date date; v_start timestamptz; v_end timestamptz; v_minutes integer; v_rate integer; v_source text; v_existing jsonb;
 begin
 if member_role(p_org) is distinct from 'owner' then raise exception 'Owner permission required'; end if;
 perform 1 from organizations where id=p_org for update;
 if jsonb_typeof(p_payload)!='object' then raise exception 'Invalid backup'; end if;
 foreach v_source in array array['employees','clients','shifts','jobs'] loop
  if jsonb_typeof(p_payload->v_source) is distinct from 'array' or jsonb_array_length(p_payload->v_source)>10000 then raise exception 'Invalid backup array'; end if;
  if exists(select 1 from jsonb_array_elements(p_payload->v_source) x where jsonb_typeof(x)!='object' or coalesce(length(x->>'id'),0) not between 1 and 160) then raise exception 'Invalid legacy ID'; end if;
  if (select count(*) from jsonb_array_elements(p_payload->v_source))!=(select count(distinct x->>'id') from jsonb_array_elements(p_payload->v_source) x) then raise exception 'Duplicate legacy ID'; end if;
 end loop;
 v_source:=md5(p_payload::text);
 if exists(select 1 from legacy_imports where organization_id=p_org and source_key=v_source) then return jsonb_build_object('already_imported',true); end if;
 insert into legacy_imports(organization_id,source_key,imported_by,backup) values(p_org,v_source,auth.uid(),p_payload);
 for v in select * from jsonb_array_elements(p_payload->'employees') loop
  if coalesce(length(trim(v->>'name')),0) not between 1 and 150 or (v->>'defaultRate')::numeric not between 0 and 100000 then raise exception 'Invalid employee'; end if;
  v_id:=null; select target_id into v_id from legacy_record_map where organization_id=p_org and kind='employee' and legacy_id=v->>'id';
  if v_id is null then
   insert into employees(organization_id,name,rate_agorot) values(p_org,trim(v->>'name'),round((v->>'defaultRate')::numeric*100)) returning id into v_id;
   insert into legacy_record_map values(p_org,'employee',v->>'id',v_id);
  end if;
 end loop;
 for v in select * from jsonb_array_elements(p_payload->'clients') loop
  v_id:=null; select target_id into v_id from legacy_record_map where organization_id=p_org and kind='customer' and legacy_id=v->>'id';
  if v_id is null then
   insert into customers(organization_id,name) values(p_org,trim(v->>'name')) returning id into v_id;
   insert into legacy_record_map values(p_org,'customer',v->>'id',v_id);
  end if;
 end loop;
 for v in select * from jsonb_array_elements(p_payload->'shifts') loop
  if (v->>'hours')::numeric not between 0.016666 and 24 or (v->>'rate')::numeric not between 0 and 100000 or v->>'part' not in ('morning','evening') then raise exception 'Invalid shift'; end if;
  v_emp:=null;v_customer:=null;
  select target_id into v_emp from legacy_record_map where organization_id=p_org and kind='employee' and legacy_id=v->>'employeeId';
  select target_id into v_customer from legacy_record_map where organization_id=p_org and kind='customer' and legacy_id=v->>'clientId';
  if v_emp is null or v_customer is null then raise exception 'Missing legacy reference'; end if;
  if exists(select 1 from legacy_record_map where organization_id=p_org and kind='shift' and legacy_id=v->>'id') then continue; end if;
  v_date:=(v->>'date')::date;v_minutes:=round((v->>'hours')::numeric*60);v_rate:=round((v->>'rate')::numeric*100);
  v_start:=((v_date::text||' '||coalesce(nullif(v->>'startTime',''),'00:00'))::timestamp at time zone 'Asia/Jerusalem');
  v_end:=v_start+make_interval(mins=>v_minutes);
  insert into jobs(organization_id,customer_id,title,business_date,status,notes,billing_kind,billing_rate_agorot,billing_minimum_agorot,billing_fixed_agorot)
  values(p_org,v_customer,'משמרת מיובאת',v_date,'submitted','הועבר מיומן מקומי; השעות דורשות אישור. כאשר שעת ההתחלה לא ידועה, חצות היא מציין מקום.','hourly',0,0,0) returning id into v_job;
  insert into job_assignments(organization_id,job_id,employee_id,status,rate_agorot) values(p_org,v_job,v_emp,'submitted',v_rate) returning id into v_assignment;
  insert into timesheets(organization_id,assignment_id,actual_start,actual_end,worked_minutes,status,correction_note) values(p_org,v_assignment,v_start,v_end,v_minutes,'submitted','Legacy import: verify original backup before approval') returning id into v_id;
  insert into legacy_record_map values(p_org,'shift',v->>'id',v_id);
 end loop;
 for v in select * from jsonb_array_elements(p_payload->'jobs') loop
  if v->>'status' not in ('open','claimed','cancelled') then raise exception 'Invalid legacy status'; end if;
  v_customer:=null;select target_id into v_customer from legacy_record_map where organization_id=p_org and kind='customer' and legacy_id=v->>'clientId';
  if v_customer is null then raise exception 'Missing customer'; end if;
  if exists(select 1 from legacy_record_map where organization_id=p_org and kind='job' and legacy_id=v->>'id') then continue; end if;
  insert into jobs(organization_id,customer_id,title,business_date,status,notes,billing_kind,billing_rate_agorot,billing_minimum_agorot,billing_fixed_agorot)
  values(p_org,v_customer,'עבודה מיובאת',(v->>'date')::date,case v->>'status' when 'cancelled' then 'cancelled' when 'claimed' then 'assigned' else 'published' end,coalesce(v->>'notes',''),'hourly',0,0,0) returning id into v_job;
  if v->>'status'='claimed' then
   v_emp:=null;select target_id into v_emp from legacy_record_map where organization_id=p_org and kind='employee' and legacy_id=v->>'claimedByEmployeeId';
   if v_emp is null then raise exception 'Missing claimed employee'; end if;
   insert into job_assignments(organization_id,job_id,employee_id,rate_agorot) select p_org,v_job,v_emp,rate_agorot from employees where id=v_emp;
  end if;
  insert into legacy_record_map values(p_org,'job',v->>'id',v_job);
 end loop;
 perform audit_change(p_org,'legacy_import',p_org,jsonb_build_object('source_key',v_source));
 return jsonb_build_object('imported',true);
 end
$$;
revoke execute on function public.import_legacy(uuid,jsonb) from public,anon;
grant execute on function public.import_legacy(uuid,jsonb) to authenticated;
