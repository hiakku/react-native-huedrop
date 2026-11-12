import test from 'node:test';
import assert from 'node:assert/strict';
import {fresh,parseSession} from '../src/session.ts';
test('old saves receive starter hints while preserving the board and completion scores',()=>{
 const old=fresh(5,{'0':4,'1':6},true,false);delete old.hintCredits;
 const updated=parseSession(JSON.stringify({version:1,game:old}));assert.equal(updated.hintCredits,3);assert.deepEqual(updated.board,old.board);assert.deepEqual(updated.best,old.best);
});
test('spent hints persist across reloads, restarts and level changes',()=>{
 const saved={...fresh(),hintCredits:0};const parsed=parseSession(JSON.stringify({version:1,game:saved}));assert.equal(parsed.hintCredits,0);
 assert.equal(fresh(1,parsed.best,parsed.labels,parsed.motion,parsed.hintCredits).hintCredits,0);
 for(const n of [-1,1.5,'3',10001])assert.throws(()=>parseSession(JSON.stringify({version:1,game:{...saved,hintCredits:n}})));
});
