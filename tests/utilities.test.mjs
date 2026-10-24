import test from 'node:test';
import assert from 'node:assert/strict';
import { safeWhatsApp, isOverdue, inToday, money, localInputTime } from '../src/lib/format.ts';

test('whatsapp link strips punctuation and rejects invalid numbers',()=>{
  assert.equal(safeWhatsApp('+963 999 123 456'),'https://wa.me/963999123456');
  assert.equal(safeWhatsApp('abc'),null);
});
test('overdue tasks exclude completed tasks',()=>{
  assert.equal(isOverdue('2020-01-01T00:00:00Z','Pending'),true);
  assert.equal(isOverdue('2020-01-01T00:00:00Z','Completed'),false);
});
test('today checks local day safely',()=>{
  assert.equal(inToday(new Date().toISOString()),true);
  assert.equal(inToday(null),false);
});
test('money reports currency separately',()=>{
  assert.match(money(100,'USD'),/100/);
  assert.match(money(100,'EUR'),/100/);
});
test('date input handles empty and invalid values',()=>{
  assert.equal(localInputTime(null),'');
  assert.equal(localInputTime('invalid'),'');
});
