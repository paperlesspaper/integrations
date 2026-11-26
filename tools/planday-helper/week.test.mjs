import test from 'node:test';
import assert from 'node:assert/strict';
import {currentWeek,resourceFor,snapshot} from './week.mjs';
test('Berlin week and scoped browser responses',()=>{
  const w=currentWeek(new Date('2026-03-29T22:15:00Z'));
  assert.deepEqual(w,{from:'2026-03-30',to:'2026-04-05'});
  const u='https://scheduling-shift-api.prod-westeurope.planday.cloud/scheduling/departments/12/day_based/shifts?from=2026-03-30&to=2026-04-05';
  assert.equal(resourceFor(u,'12',w),'shifts');
  assert.equal(resourceFor(u,'123',w),null);
  assert.equal(resourceFor(u.replace('2026-04-05','2026-04-06'),'12',w),null);
  assert.equal(resourceFor(u.replace('.cloud/','.cloud.example/'),'12',w),null);
});
test('only scheduled names and allowlisted fields are transferred',()=>{
  const s=snapshot([{id:1,employee_id:3,date:'2026-03-30',cost:120},{id:2,status:'Open'}],
    [{id:3,display_name:'Anne Berg',salary:9},{id:4,display_name:'Other'}],'12',{from:'2026-03-30',to:'2026-04-05'});
  assert.equal(s.shifts.length,1);
  assert.equal(s.employees[0].display,'Anne Berg');
  assert.deepEqual(s.employees[1],{id:4});
  assert.doesNotMatch(JSON.stringify(s),/cost|salary|Other/);
});
