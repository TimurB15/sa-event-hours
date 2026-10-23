import { useCallback, useEffect, useRef, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { z } from 'zod'
import { cloud, exchangeAuthCallback } from './client'
import { assignmentSchema, customerSchema, employeeSchema, emptySnapshot, jobSchema, memberSchema, notificationSchema, paymentSchema, timesheetSchema, type Snapshot } from './schema'
export function useWorkspace() {
  const [session,setSession]=useState<Session|null>(null)
  const [ready,setReady]=useState(!cloud)
  const [snapshot,setSnapshot]=useState<Snapshot>(emptySnapshot)
  const [org,setOrg]=useState('')
  const [loading,setLoading]=useState(false)
  const [error,setError]=useState('')
  const request=useRef(0)
  useEffect(()=>{
    if(!cloud)return
    if (new URL(location.href).searchParams.has('code')) {
      void exchangeAuthCallback(location.href).then(() => history.replaceState(null,'',location.pathname+'#/cloud')).catch(e => setError(String(e)))
    }
    void cloud.auth.getSession().then(({data,error})=>{if(error)setError(error.message);setSession(data.session);setReady(true)})
    const {data}=cloud.auth.onAuthStateChange((_event,next)=>{request.current++;setSession(next);setSnapshot(emptySnapshot);setOrg('')})
    return()=>data.subscription.unsubscribe()
  },[])
  const refresh=useCallback(async()=>{
    if(!cloud||!session)return
    const generation=++request.current
    setLoading(true);setError('')
    try {
      const membership=await cloud.from('organization_members').select('*').eq('user_id',session.user.id)
      if(membership.error)throw membership.error
      const members=z.array(memberSchema).parse(membership.data)
      const active=members.some(m=>m.organization_id===org)?org:members[0]?.organization_id??''
      if(!active){setSnapshot({...emptySnapshot,members});return}
      const queries=await Promise.all([
        cloud.from('jobs').select('id,organization_id,customer_id,title,address,business_date,planned_start,planned_end,required_workers,status,contact_phone,notes,version').eq('organization_id',active).order('business_date'),
        cloud.from('employees').select('*').eq('organization_id',active),
        cloud.from('customers').select('*').eq('organization_id',active),
        cloud.from('job_assignments').select('id,job_id,employee_id,status,rate_agorot').eq('organization_id',active),
        cloud.from('timesheets').select('id,assignment_id,actual_start,actual_end,break_minutes,status,worked_minutes,wage_agorot,version,correction_note').eq('organization_id',active),
        cloud.from('payments').select('id,timesheet_id,direction,amount_agorot').eq('organization_id',active),
        cloud.from('notifications').select('id,message,read_at,created_at').eq('organization_id',active).order('created_at',{ascending:false}).limit(50),
      ])
      for(const result of queries)if(result.error)throw result.error
      if(generation!==request.current)return
      setSnapshot({members,jobs:z.array(jobSchema).parse(queries[0].data),employees:z.array(employeeSchema).parse(queries[1].data),customers:z.array(customerSchema).parse(queries[2].data),assignments:z.array(assignmentSchema).parse(queries[3].data),timesheets:z.array(timesheetSchema).parse(queries[4].data),payments:z.array(paymentSchema).parse(queries[5].data),notifications:z.array(notificationSchema).parse(queries[6].data)})
      if(active!==org)setOrg(active)
    }catch(e){if(generation===request.current)setError(e instanceof Error?e.message:'טעינת הנתונים נכשלה')}
    finally{if(generation===request.current)setLoading(false)}
  },[session,org])
  useEffect(()=>{void refresh()},[refresh])
  useEffect(()=>{
    if(!cloud||!org)return
    const channel=cloud.channel(`workspace:${org}`).on('postgres_changes',{event:'*',schema:'public',filter:`organization_id=eq.${org}`},()=>void refresh()).subscribe()
    // Polling is a fallback until Realtime publication is configured.
    const timer=setInterval(()=>{if(document.visibilityState==='visible'&&navigator.onLine)void refresh()},30000)
    const onOnline=()=>void refresh();addEventListener('online',onOnline)
    return()=>{if(cloud)void cloud.removeChannel(channel);clearInterval(timer);removeEventListener('online',onOnline)}
  },[org,refresh])
  return{session,ready,snapshot,org,setOrg,loading,error,refresh}
}
