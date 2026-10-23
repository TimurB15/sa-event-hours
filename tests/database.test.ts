import { PGlite } from '@electric-sql/pglite'
import { readFileSync } from 'node:fs'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
let db:PGlite
const owner='00000000-0000-4000-8000-000000000001',worker='00000000-0000-4000-8000-000000000002',outsider='00000000-0000-4000-8000-000000000003'
let org:string,customer:string,job:string,employee:string,assignment:string
async function login(id:string,email='owner@example.test') { await db.exec(`reset role; set request.jwt.claim.sub='${id}'; set request.jwt.claim.email='${email}'; set role authenticated`) }
async function scalar(sql:string,params:unknown[]=[]){const result=await db.query<Record<string,unknown>>(sql,params);return Object.values(result.rows[0])[0] as string}
beforeAll(async()=>{
 db=new PGlite()
 await db.exec(`create role anon; create role authenticated; create schema auth; create table auth.users(id uuid primary key); insert into auth.users values('${owner}'),('${worker}'),('${outsider}'); create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$; create function auth.jwt() returns jsonb language sql stable as $$ select jsonb_build_object('email',current_setting('request.jwt.claim.email',true)) $$; grant usage on schema auth to authenticated,anon; grant execute on all functions in schema auth to authenticated,anon;`)
 await db.exec(readFileSync(new URL('../supabase/migrations/202610230001_core.sql',import.meta.url),'utf8'))
 await db.exec(readFileSync(new URL('../supabase/migrations/202610230002_legacy_import.sql',import.meta.url),'utf8'))
 await db.exec(readFileSync(new URL('../supabase/migrations/202610230003_billing.sql',import.meta.url),'utf8'))
 await login(owner)
 org=await scalar('select create_organization($1,$2)',['SA Test','Owner'])
 customer=await scalar("select save_customer($1,'Customer','minimum',6500,40000,0)",[org])
 const token=await scalar("select invite_worker($1,'worker@example.test','Worker',5000,'worker')",[org])
 await login(worker,'worker@example.test')
 await scalar('select accept_invitation($1)',[token])
 employee=await scalar('select id from employees where user_id=auth.uid()')
 await login(owner)
 job=await scalar("select publish_job($1,$2,'Event','2026-10-23')",[org,customer])
},30000)
afterAll(async()=>{await db.close()})
describe('PostgreSQL authorization and workflow',()=>{
 it('imports once, keeps source backups and rolls back malformed imports',async()=>{
  await login(owner)
  const payload={employees:[{id:'legacy-e',name:'Imported',defaultRate:50}],clients:[{id:'legacy-c',name:'Imported Customer'}],shifts:[{id:'legacy-s',date:'2026-10-23',employeeId:'legacy-e',clientId:'legacy-c',part:'evening',hours:7,rate:50}],jobs:[]}
  await db.query('select import_legacy($1,$2)',[org,JSON.stringify(payload)])
  await db.query('select import_legacy($1,$2)',[org,JSON.stringify(payload)])
  expect((await db.query('select * from legacy_imports')).rows).toHaveLength(1)
  expect((await db.query("select id from timesheets where correction_note like 'Legacy%'")).rows).toHaveLength(1)
  await expect(db.query('select import_legacy($1,$2)',[org,JSON.stringify({...payload,employees:[...payload.employees,...payload.employees]})])).rejects.toThrow('Duplicate legacy ID')
  expect((await db.query('select * from legacy_imports')).rows).toHaveLength(1)
  await login(worker,'worker@example.test')
  await expect(db.query('select import_legacy($1,$2)',[org,JSON.stringify(payload)])).rejects.toThrow('Owner permission')
 })

 it('denies anonymous reads and cross-organization access',async()=>{
  await login(outsider)
  expect((await db.query('select id from jobs')).rows).toHaveLength(0)
  expect((await db.query('select * from employees')).rows).toHaveLength(0)
  await expect(db.query('select claim_job($1)',[job])).rejects.toThrow('Job unavailable')
  await db.exec('reset role; set role anon')
  await expect(db.query('select id from jobs')).rejects.toThrow()
 })
 it('prevents workers changing rates, impersonating staff or creating invitations',async()=>{
  await login(worker,'worker@example.test')
  expect((await db.query('select * from employees')).rows).toHaveLength(1)
  expect((await db.query('select * from customers')).rows).toHaveLength(0)
  await expect(db.query('update employees set rate_agorot=1')).rejects.toThrow()
  await expect(db.query('select claim_job($1,$2)',[job,employee])).rejects.toThrow('Employee unavailable')
  await expect(db.query("select invite_worker($1,'bad@example.test','Bad')",[org])).rejects.toThrow()
 })
 it('makes claims idempotent without creating paid hours and rejects overbooking',async()=>{
  await login(worker,'worker@example.test')
  assignment=await scalar('select claim_job($1)',[job])
  expect(await scalar('select claim_job($1)',[job])).toBe(assignment)
  expect((await db.query('select id from timesheets')).rows).toHaveLength(0)
  await login(owner)
  await expect(db.query('select claim_job($1)',[job])).rejects.toThrow('No remaining slots')
 })
 it('requires approval, checks versions, snapshots rates and audits corrections',async()=>{
  await login(worker,'worker@example.test')
  const t=await scalar('select start_shift($1)',[assignment])
  // Simulate elapsed time in the fixture, never through a client mutation.
  await db.exec('reset role')
  await db.query("update timesheets set actual_start=now()-interval '7 hours' where id=$1",[t])
  await login(worker,'worker@example.test')
  await db.query('select submit_timesheet($1,1,0)',[t])
  await expect(db.query('select review_timesheet($1,2,true)',[t])).rejects.toThrow()
  await login(owner)
  await expect(db.query('select review_timesheet($1,1,true)',[t])).rejects.toThrow('Timesheet changed')
  await db.query('select review_timesheet($1,2,true)',[t])
  const rows=await db.query<{wage_agorot:number}>('select wage_agorot from timesheets where id=$1',[t])
  expect(Number(rows.rows[0].wage_agorot)).toBe(35000)
  expect(Number(await scalar('select amount_agorot from invoices where job_id=$1',[job]))).toBe(45500)
  const payment='00000000-0000-4000-8000-000000000010'
  await db.query("select record_payment($1,$2,'worker_payment',10000)",[payment,t])
  await db.query("select record_payment($1,$2,'worker_payment',10000)",[payment,t])
  expect((await db.query('select * from payments')).rows).toHaveLength(1)
  await expect(db.query("select record_payment($1,$2,'worker_payment',40000)",['00000000-0000-4000-8000-000000000011',t])).rejects.toThrow('Payment exceeds balance')
  await expect(db.query("select correct_timesheet($1,3,now()-interval '6 hours',now(),0,'correction')",[t])).rejects.toThrow('Reconcile existing payments')
  expect((await db.query("select * from audit_logs where action='timesheet_reviewed'")).rows).toHaveLength(1)
 })
})
