import { z } from 'zod'
export const memberSchema=z.object({organization_id:z.uuid(),user_id:z.uuid(),role:z.enum(['owner','manager','worker']),display_name:z.string()})
export const jobSchema=z.object({id:z.uuid(),organization_id:z.uuid(),customer_id:z.uuid(),title:z.string(),address:z.string(),business_date:z.string(),planned_start:z.string().nullable(),planned_end:z.string().nullable(),required_workers:z.number(),status:z.string(),contact_phone:z.string(),notes:z.string(),version:z.number()})
export const employeeSchema=z.object({id:z.uuid(),organization_id:z.uuid(),user_id:z.string().nullable(),name:z.string(),rate_agorot:z.number(),archived:z.boolean()})
export const customerSchema=z.object({id:z.uuid(),name:z.string(),billing_kind:z.string(),rate_agorot:z.number(),minimum_agorot:z.number(),fixed_agorot:z.number()})
export const assignmentSchema=z.object({id:z.uuid(),job_id:z.uuid(),employee_id:z.uuid(),status:z.string(),rate_agorot:z.number()})
export const timesheetSchema=z.object({id:z.uuid(),assignment_id:z.uuid(),actual_start:z.string(),actual_end:z.string().nullable(),break_minutes:z.number(),status:z.string(),worked_minutes:z.number().nullable(),wage_agorot:z.number().nullable(),version:z.number(),correction_note:z.string()})
export const paymentSchema=z.object({id:z.uuid(),timesheet_id:z.uuid(),direction:z.string(),amount_agorot:z.number()})
export const notificationSchema=z.object({id:z.uuid(),message:z.string(),read_at:z.string().nullable(),created_at:z.string()})
export type Job=z.infer<typeof jobSchema>
export type Timesheet=z.infer<typeof timesheetSchema>
export type Snapshot={members:z.infer<typeof memberSchema>[];jobs:Job[];employees:z.infer<typeof employeeSchema>[];customers:z.infer<typeof customerSchema>[];assignments:z.infer<typeof assignmentSchema>[];timesheets:Timesheet[];payments:z.infer<typeof paymentSchema>[];notifications:z.infer<typeof notificationSchema>[]}
export const emptySnapshot:Snapshot={members:[],jobs:[],employees:[],customers:[],assignments:[],timesheets:[],payments:[],notifications:[]}
