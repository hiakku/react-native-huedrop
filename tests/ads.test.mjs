import test from 'node:test';
import assert from 'node:assert/strict';
import {AdController,breakMilestone} from '../src/ads/controller.ts';
class FakeAd {
 listeners=new Map();loads=0;shows=0;destroyed=false;reject=false;
 on(e,cb){if(!this.listeners.has(e))this.listeners.set(e,new Set());this.listeners.get(e).add(cb);return()=>this.listeners.get(e).delete(cb);}
 emit(e){for(const cb of this.listeners.get(e)||[])cb();}
 load(){this.loads++;}
 show(){this.shows++;return this.reject?Promise.reject(Error('SDK rejected')):Promise.resolve();}
 destroy(){this.destroyed=true;}
}
async function fixture(){let now=0;const ads={rewarded:new FakeAd(),interstitial:new FakeAd()};const controller=new AdController({initialize:async()=>{},create:k=>ads[k]},()=>now);await controller.start();return{controller,ads,setTime:n=>now=n};}
test('reward requires an SDK earned event, is idempotent, and never arrives from close',async()=>{
 const {controller:c,ads}=await fixture();let credits=0,closed;
 assert.equal(c.watchReward(()=>credits++,()=>{}),false);
 ads.rewarded.emit('loaded');
 assert.equal(c.watchReward(()=>credits++,earned=>closed=earned),true);
 await Promise.resolve();assert.equal(credits,0); // show() resolving is not a reward
 assert.equal(c.watchReward(()=>credits++,()=>{}),false);
 ads.rewarded.emit('earned');ads.rewarded.emit('earned');assert.equal(credits,1);
 ads.rewarded.emit('closed');assert.equal(closed,true);assert.equal(c.getSnapshot().showing,false);
 ads.rewarded.emit('earned');assert.equal(credits,1);assert.equal(ads.rewarded.loads,2);
 ads.rewarded.emit('loaded');c.watchReward(()=>credits++,earned=>closed=earned);ads.rewarded.emit('closed');assert.equal(closed,false);assert.equal(credits,1);c.dispose();
});
test('show errors and unavailable interstitials let navigation continue exactly once',async()=>{
 const {controller:c,ads}=await fixture();let continued=0;
 assert.equal(c.showBreak(true,()=>continued++),false);assert.equal(continued,1);
 ads.interstitial.emit('loaded');ads.interstitial.reject=true;
 c.showBreak(true,()=>continued++);await Promise.resolve();
 assert.equal(continued,2);assert.equal(c.getSnapshot().showing,false);
 ads.interstitial.emit('closed');assert.equal(continued,2);c.dispose();
});
test('breaks only follow five new completions, respect cooldown and avoid back-to-back rewarded ads',async()=>{
 let best={};for(let i=0;i<10;i++){assert.equal(breakMilestone(best,i),(i+1)%5===0);best[i]=10;assert.equal(breakMilestone(best,i),false);}
 const {controller:c,ads,setTime}=await fixture();let count=0;
 ads.interstitial.emit('loaded');assert.equal(c.showBreak(false,()=>count++),false);
 assert.equal(c.showBreak(true,()=>count++),true);ads.interstitial.emit('closed');
 ads.interstitial.emit('loaded');setTime(179999);assert.equal(c.showBreak(true,()=>count++),false);
 setTime(180001);ads.rewarded.emit('loaded');c.watchReward(()=>{},()=>{});ads.rewarded.emit('closed');
 assert.equal(c.showBreak(true,()=>count++),false);setTime(270002);assert.equal(c.showBreak(true,()=>count++),true);ads.interstitial.emit('closed');assert.equal(count,5);c.dispose();
});
test('stale inventory is reloaded, load errors can be retried without parallel loads',async()=>{
 const {controller:c,ads,setTime}=await fixture();await c.start();assert.equal(ads.rewarded.loads,1);
 ads.rewarded.emit('error');await c.start();assert.equal(ads.rewarded.loads,2);
 ads.rewarded.emit('loaded');setTime(3600001);assert.equal(c.watchReward(()=>{},()=>{}),false);assert.equal(ads.rewarded.loads,3);c.dispose();
});
test('dispose removes listeners and a strict-mode setup/cleanup/setup does not destroy the live controller',async()=>{
 const {controller:c,ads}=await fixture();let rewarded=0;
 const release=c.mount();release();const finalRelease=c.mount();await Promise.resolve();assert.equal(ads.rewarded.destroyed,false);
 ads.rewarded.emit('loaded');c.watchReward(()=>rewarded++,()=>{});finalRelease();await Promise.resolve();
 ads.rewarded.emit('earned');assert.equal(rewarded,0);assert.equal(ads.rewarded.destroyed,true);
});
test('initialization failure is recoverable and cannot start an ad',async()=>{
 let fail=true;const ad=new FakeAd();const c=new AdController({initialize:async()=>{if(fail)throw Error();},create:()=>ad});await c.start();assert.equal(c.getSnapshot().status,'error');assert.equal(c.watchReward(()=>{},()=>{}),false);fail=false;await c.start();assert.equal(ad.loads,2);c.dispose();
});
