import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const sql = fs.readFileSync(new URL('../supabase/migrations/202610240001_initial.sql', import.meta.url),'utf8');
test('RLS enabled on all CRM tables in migration source',()=>{
  for(const name of ['profiles','customers','deals','tasks','appointments','activities']){
    assert.match(sql,new RegExp(`alter table public\\.${name} enable row level security;`));
    assert.match(sql,new RegExp(`create policy ${name}_select`));
  }
});
test('Cross-owner links protected by composite FKs',()=>{
  for(const key of ['deals_customer_owner_fk','tasks_customer_owner_fk','tasks_deal_owner_fk','appointments_customer_owner_fk','activities_customer_owner_fk']) assert.ok(sql.includes(key));
});
test('Unauthenticated access explicitly revoked',()=>{
  assert.ok(sql.includes('from anon, authenticated;'));
  assert.ok(sql.includes('to authenticated;'));
});
