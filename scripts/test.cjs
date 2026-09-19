const test = require('node:test');
const assert = require('node:assert/strict');
const u = require('../dist');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const xlsx = require('xlsx');

test('array helpers preserve inputs and set semantics', () => {
  const values = Object.freeze([1,2,2,3]);
  assert.deepEqual(u.unique(values), [1,2,3]);
  assert.deepEqual(u.chunk(values, 3), [[1,2,2],[3]]);
  assert.throws(() => u.chunk(values, 0), RangeError);
  assert.deepEqual(u.intersection(values, [2,3]), [2,3]);
  assert.deepEqual(u.difference(values, [2]), [1,3]);
  assert.deepEqual(u.groupBy(values, n => n % 2).get(0), [2,2]);
});
test('clone preserves cycles, descriptors, symbols and collections', () => {
  const symbol = Symbol();
  const source = { list:[1,null,undefined], date:new Date(123), re:/a/g, map:new Map(), set:new Set(), [symbol]:{x:1} };
  source.self = source; source.map.set(source, source.list); source.set.add(source);
  Object.defineProperty(source, 'hidden', {value:{x:2}, enumerable:false});
  const clone = u.deepClone(source);
  assert.notEqual(clone, source); assert.equal(clone.self, clone);
  assert.deepEqual(clone.list, source.list); assert.equal(clone.map.get(clone), clone.list);
  assert.ok(clone.set.has(clone)); assert.equal(clone.date.getTime(), 123);
  assert.notEqual(clone[symbol], source[symbol]); assert.notEqual(clone.hidden, source.hidden);
  assert.equal(u.copy.deepcopy(42), 42);
});
test('equality handles null, key order, cycles and shallow comparison', () => {
  assert.equal(u.isEqual(null, {}), false);
  assert.ok(u.isEqual({a:1,b:2}, {b:2,a:1}));
  assert.ok(u.isEqual(NaN, NaN)); assert.equal(u.isEqual(new Map(), new Map()), false);
  const a = {}; a.self = a; const b = {}; b.self = b;
  assert.ok(u.isEqual(a,b)); assert.equal(u.isEqual(a,{self:{}}), false);
  assert.equal(u.shallowEqual({x:{}}, {x:{}}), false);
  assert.equal(u.isEqual(new Array(1), []), false);
});
test('debounce, throttle and once controls', async () => {
  const calls = []; const context = {base:10};
  const d = u.debounce(function(n) { calls.push(this.base+n); return this.base+n; }, 5);
  d.call(context,1); d.call(context,2); assert.equal(d.flush(),12);
  d.call(context,3); d.cancel(); await u.sleep(15); assert.deepEqual(calls,[12]);
  const t = u.throttle(n => calls.push(n),5);
  t(1); t(2); t(3); await u.sleep(20); t.cancel(); assert.deepEqual(calls,[12,1,3]);
  let count = 0; const once = u.once(() => ++count); assert.equal(once(),1); assert.equal(once(),1);
  assert.throws(() => u.debounce(() => {}, -1), RangeError);
});
test('async retry, timeout and concurrency', async () => {
  assert.equal(await u.retry(n => { if(n < 3) throw Error('retry'); return n; }, {retries:2}),3);
  await assert.rejects(u.retry(() => {throw Error('failed')}, {retries:0}), /failed/);
  await assert.rejects(u.withTimeout(new Promise(() => {}), 5), /timed out/);
  assert.equal(await u.withTimeout(Promise.resolve(4), 1000),4);
  let active = 0, max = 0;
  const result = await u.mapLimit([1,2,3,4],2,async n => { active++; max=Math.max(max,active); await u.sleep(5); active--; return n*2; });
  assert.deepEqual(result,[2,4,6,8]); assert.equal(max,2);
  await assert.rejects(u.mapLimit([1],0,n => n),RangeError);
  let started=0; await assert.rejects(u.mapLimit([1,2,3],1,() => {started++; throw Error('stop')}),/stop/); assert.equal(started,1);
});
class Reader {
  readAsArrayBuffer(blob) { this.read(blob, false); }
  readAsDataURL(blob) { this.read(blob, true); }
  read(blob, dataURL) {
    if (blob.fail) {queueMicrotask(() => { this.error=Error('read failed'); this.onerror(); }); return;}
    if (blob.abort) {queueMicrotask(() => this.onabort()); return;}
    blob.arrayBuffer().then(buffer => { this.result=dataURL ? `data:${blob.type};base64,${Buffer.from(buffer).toString('base64')}` : buffer; this.onload(); });
  }
}
test('file Promise, callbacks and errors (mock FileReader)', async () => {
  const previous = global.FileReader; global.FileReader = Reader;
  try {
    const file = new File(['Hello'],'hello.txt',{type:'text/plain'});
    const data = await u.fileToBase64(file); assert.equal(data,'data:text/plain;base64,SGVsbG8=');
    let called; assert.equal(await u.fileToBase64(file,v => {called=v}),data); assert.equal(called,data);
    assert.equal(await (await u.fileToBlob(file)).text(),'Hello');
    assert.equal(await u.blobToDataURL(file), data);
    assert.equal(await u.base64ToFile(data,'a.txt').text(),'Hello');
    assert.throws(() => u.base64ToBlob('invalid'), TypeError);
    await assert.rejects(u.fileToBase64({fail:true}),/read failed/);
    await assert.rejects(u.fileToBase64({abort:true}),/aborted/);
    await assert.rejects(u.fileToBase64(file,() => {throw Error('callback')}),/callback/);
  } finally { global.FileReader = previous; }
});
test('Excel path and File reading, missing sheets', async () => {
  const workbook = xlsx.utils.book_new();
  xlsx.utils.book_append_sheet(workbook,xlsx.utils.json_to_sheet([{name:'Alice',score:90}]),'People');
  const directory = fs.mkdtempSync(path.join(os.tmpdir(),'utils-test-'));
  try {
    const filename = path.join(directory,'test.xlsx'); xlsx.writeFile(workbook,filename);
    assert.deepEqual(u.readExcelToJSON(filename),[{name:'Alice',score:90}]);
    assert.throws(() => u.readExcelToJSON(filename,'missing'),/Worksheet not found/);
    const file = new File([fs.readFileSync(filename)],'test.xlsx');
    assert.deepEqual(await u.readExcelToJSON(file,'People'),[{name:'Alice',score:90}]);
    await assert.rejects(u.readExcelToJSON(file,'missing'),/Worksheet not found/);
  } finally { fs.rmSync(directory,{recursive:true,force:true}); }
});
test('object utilities handle own keys and prevent prototype pollution', () => {
  const symbol = Symbol(); const object = {a:1,b:2,[symbol]:3};
  assert.deepEqual(u.pick(object,['a',symbol]), {a:1,[symbol]:3});
  assert.deepEqual(u.omit(object,['b']), {a:1,[symbol]:3});
  assert.equal(u.get({a:{list:[4]}},'a.list.0'),4);
  assert.equal(u.get({'a.b':5},['a.b']),5);
  assert.equal(u.get({},'toString','fallback'),'fallback');
  assert.equal(u.get({a:null},'a',5),null);
  assert.ok(u.isEmpty(new Map())); assert.equal(u.isEmpty(0),false); assert.equal(u.isEmpty(false),false);
  assert.equal(u.isEmpty({[symbol]:1}),false);
  const a = {nested:{a:1},list:[1]}; const b = {nested:{b:2},list:[2]};
  assert.deepEqual(u.deepMerge(a,b),{nested:{a:1,b:2},list:[2]});
  assert.deepEqual(a,{nested:{a:1},list:[1]});
  const malicious = JSON.parse('{"__proto__":{"polluted":true},"constructor":{"prototype":{"polluted":true}}}');
  const result = u.deepMerge(malicious);
  assert.equal({}.polluted,undefined); assert.ok(Object.hasOwn(result,'__proto__'));
  const cycle = {}; cycle.self = cycle; assert.throws(() => u.deepMerge(cycle),/cyclic/);
});
test('string utilities normalize words and count code points', () => {
  assert.equal(u.camelCase('HTTP_response-code'),'httpResponseCode');
  assert.equal(u.kebabCase('XMLHttpRequest'),'xml-http-request');
  assert.equal(u.capitalize('hello'),'Hello'); assert.equal(u.capitalize(''),'');
  assert.equal(u.truncate('😀😃😄😁',3,'…'),'😀😃…');
  assert.equal(u.truncate('hello',2),'..'); assert.equal(u.truncate('hi',4),'hi');
  assert.equal(u.truncate('hello',0),''); assert.throws(() => u.truncate('a',-1),RangeError);
});
test('number utilities validate bounds and define empty statistics', () => {
  assert.equal(u.clamp(12,0,10),10); assert.equal(u.clamp(-1,0,10),0);
  assert.ok(u.inRange(10,0,10)); assert.equal(u.inRange(NaN,0,10),false);
  assert.throws(() => u.clamp(1,5,0),RangeError); assert.throws(() => u.inRange(1,NaN,2),RangeError);
  assert.equal(u.sum([]),0); assert.equal(u.sum([1,2,3]),6);
  assert.equal(u.average([2,4]),3); assert.ok(Number.isNaN(u.average([])));
});
test('query utilities round-trip repeated keys, Unicode and special names', () => {
  const query = u.stringifyQuery({tag:['a','b'],q:'你好 a+b',empty:null,skip:undefined,n:2});
  const parsed = u.parseQuery('?'+query+'#fragment');
  assert.deepEqual(parsed.tag,['a','b']); assert.equal(parsed.q,'你好 a+b');
  assert.equal(parsed.empty,''); assert.equal(parsed.skip,undefined); assert.equal(parsed.n,'2');
  const malicious = u.parseQuery('__proto__=safe&constructor=value');
  assert.equal(Object.getPrototypeOf(malicious),null); assert.equal(malicious.__proto__,'safe');
});
test('trees preserve order, leave inputs intact and reject malformed graphs', () => {
  const input = Object.freeze([{id:2,parent:1},{id:1,parent:null},{id:3,parent:99}].map(Object.freeze));
  const options = {getId:n=>n.id,getParentId:n=>n.parent};
  const tree = u.listToTree(input,options);
  assert.deepEqual(tree.map(n=>n.id),[1,3]); assert.equal(tree[0].children[0].id,2);
  assert.equal(input[0].children,undefined);
  assert.deepEqual(u.treeToList(tree,n=>n.children).map(n=>n.id),[1,2,3]);
  assert.equal(u.findTreeNode(tree,n=>n.id===2,n=>n.children),tree[0].children[0]);
  assert.equal(u.findTreeNode(tree,n=>n.id===9,n=>n.children),undefined);
  assert.throws(()=>u.listToTree([{id:1},{id:1}],options),/Duplicate/);
  assert.throws(()=>u.listToTree([{id:1,parent:2},{id:2,parent:1}],options),/Cyclic/);
  const node={children:[]}; node.children.push(node);
  assert.throws(()=>u.treeToList([node],n=>n.children),/cycle/);
  const many=Array.from({length:20000},(_,id)=>({id,parent:id ? id-1 : null}));
  assert.equal(u.treeToList(u.listToTree(many,options),n=>n.children).length,20000);
});
test('date helpers validate, format and use calendar-day semantics', () => {
  const date = new Date(2024, 1, 29, 5, 6, 7, 8);
  assert.equal(u.formatDate(date, 'YYYY/MM/DD HH:mm:ss.SSS'), '2024/02/29 05:06:07.008');
  const next = u.addDays(date, 1); assert.equal(next.getDate(), 1); assert.notEqual(next,date);
  assert.equal(u.differenceInDays(new Date(2024,2,1,23),new Date(2024,1,28,1)),2);
  assert.equal(u.isValidDate(new Date('bad')),false); assert.throws(()=>u.formatDate(new Date('bad')),RangeError);
});
test('random helpers support deterministic injection and valid UUIDs', () => {
  assert.equal(u.randomInt(2,4,()=>0),2); assert.equal(u.randomInt(2,4,()=>0.999),4);
  assert.deepEqual(u.shuffle([1,2,3],()=>0),[2,3,1]); assert.equal(u.sample([],()=>0),undefined);
  assert.throws(()=>u.randomInt(0,1,()=>1),RangeError);
  assert.match(u.uuid(),/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
});
test('storage supports prefixes, expiration, malformed values and falsy data', () => {
  const map = new Map(); const storage={getItem:k=>map.has(k)?map.get(k):null,setItem:(k,v)=>map.set(k,v),removeItem:k=>map.delete(k)};
  const cache=u.createStorage(storage,'app:'); cache.set('zero',0); assert.equal(cache.get('zero'),0);
  cache.set('gone','x',0); assert.equal(cache.get('gone','fallback'),'fallback'); assert.equal(map.has('app:gone'),false);
  map.set('app:bad','{'); assert.equal(cache.get('bad',9),9); assert.equal(map.has('app:bad'),false);
  cache.remove('zero'); assert.equal(cache.get('zero'),undefined); assert.throws(()=>cache.set('x',1,-1),RangeError);
});
test('event emitter handles mutation, once, unsubscribe and errors synchronously', () => {
  const emitter=new u.EventEmitter(); const calls=[];
  const remove=emitter.on('change',value=>{calls.push(value);remove()});
  emitter.once('change',value=>calls.push(value*10));
  assert.equal(emitter.emit('change',2),true); assert.equal(emitter.emit('change',3),false);
  assert.deepEqual(calls,[2,20]); assert.equal(emitter.listenerCount('change'),0);
  emitter.on('error',()=>{throw Error('listener')}); assert.throws(()=>emitter.emit('error'),/listener/); emitter.clear();
});
test('queue, stack, priority queue and LRU cache', () => {
  const queue=new u.Queue(); queue.enqueue(1);queue.enqueue(2);assert.equal(queue.dequeue(),1);assert.equal(queue.peek(),2);queue.clear();assert.equal(queue.size,0);
  const stack=new u.Stack();stack.push(1);stack.push(2);assert.equal(stack.pop(),2);assert.equal(stack.peek(),1);
  const priority=new u.PriorityQueue((a,b)=>a-b);[3,1,2].forEach(x=>priority.enqueue(x));assert.deepEqual([priority.dequeue(),priority.dequeue(),priority.dequeue()],[1,2,3]);
  const lru=new u.LRUCache(2);lru.set('a',1).set('b',2);assert.equal(lru.get('a'),1);lru.set('c',3);assert.equal(lru.has('b'),false);assert.deepEqual([...lru.keys()],['a','c']);
  assert.throws(()=>new u.LRUCache(0),RangeError);
});
test('safe JSON and stable serialization', () => {
  assert.deepEqual(u.safeJsonParse('{"x":1}'),{ok:true,value:{x:1}}); assert.equal(u.safeJsonParse('{').ok,false);
  assert.equal(u.stableStringify({z:1,a:{d:2,c:3}}),'{"a":{"c":3,"d":2},"z":1}');
  assert.equal(u.stableStringify({b:1,a:2}),u.stableStringify({a:2,b:1}));
  const malicious=JSON.parse('{"__proto__":1}');assert.equal(u.stableStringify(malicious),'{"__proto__":1}');
  const cycle={};cycle.self=cycle;assert.throws(()=>u.stableStringify(cycle),/cyclic/);
});
test('math statistics define interpolation and reject invalid input', () => {
  assert.equal(u.median([3,1,2]),2);assert.equal(u.median([1,2,3,4]),2.5);
  assert.equal(u.variance([1,2,3]),2/3);assert.equal(u.percentile([0,10,20],.25),5);
  assert.throws(()=>u.median([]),RangeError);assert.throws(()=>u.variance([Infinity]),RangeError);assert.throws(()=>u.percentile([1],2),RangeError);
});
test('regular validators fix dates, domains, IPs, URLs, XML and IDs',()=>{
  assert.ok(u.isData('2024-02-29'));assert.equal(u.isData('2023-02-29'),false);assert.equal(u.isData('2024-1-1x'),false);
  assert.ok(u.isDomainName('example.com'));assert.equal(u.isDomainName('-bad.com'),false);
  assert.ok(u.isIp('192.168.0.1'));assert.equal(u.isIp('01.2.3.4'),false);assert.equal(u.isIp('256.0.0.1'),false);
  assert.ok(u.isInternetUrl('https://example.com/a?q=1'));assert.equal(u.isInternetUrl('javascript:alert(1)'),false);
  assert.ok(u.isXml('hello-world.XML'));assert.equal(u.isXml('folder/a.xml'),false);
  assert.ok(u.isId('11010519491231002X'));assert.equal(u.isId('110105194912310021'),false);
  assert.ok(u.isPhoneNumer('19912345678'));assert.ok(u.isChinese('𠀀中文'));
});
test('collection helpers preserve stable order',()=>{
  assert.deepEqual([...u.keyBy([{id:1,v:'a'},{id:1,v:'b'}],x=>x.id).values()],[{id:1,v:'b'}]);
  assert.deepEqual([...u.countBy(['a','bb','c'],x=>x.length)],[ [1,2],[2,1] ]);
  assert.deepEqual(u.partition([1,2,3],x=>x%2===1),[[1,3],[2]]);
  assert.deepEqual(u.orderBy([{a:1,b:2},{a:1,b:3},{a:0,b:9}],[{iteratee:x=>x.a},{iteratee:x=>x.b,direction:'desc'}]).map(x=>x.b),[9,3,2]);
});
test('memoize caches values and removes rejected async results',async()=>{
  let calls=0;const fn=u.memoize((a,b)=>{calls++;return a+b});assert.equal(fn(1,2),3);assert.equal(fn(1,2),3);assert.equal(calls,1);fn.clear();fn(1,2);assert.equal(calls,2);
  let attempts=0;const asyncFn=u.memoizeAsync(async x=>{attempts++;if(attempts===1)throw Error('x');return x});await assert.rejects(asyncFn(1));assert.equal(await asyncFn(1),1);assert.equal(attempts,2);
});
test('result and assertion helpers',async()=>{
  assert.deepEqual(u.tryCatch(()=>1),{ok:true,value:1});assert.equal(u.tryCatch(()=>{throw Error('x')}).ok,false);
  assert.equal((await u.tryCatchAsync(async()=>2)).value,2);assert.throws(()=>u.invariant(false,'bad'),/bad/);assert.throws(()=>u.assertDefined(null));assert.throws(()=>u.assertNever('x'),/x/);
});
test('encoding round trips binary, UTF-8, base64 and base64url',()=>{
  const bytes=u.utf8ToBytes('你好😀');assert.equal(u.bytesToUtf8(bytes),'你好😀');assert.deepEqual([...u.hexToBytes(u.bytesToHex(bytes))],[...bytes]);
  assert.deepEqual([...u.base64ToBytes(u.bytesToBase64(bytes))],[...bytes]);assert.deepEqual([...u.base64UrlToBytes(u.bytesToBase64Url(bytes))],[...bytes]);
  assert.throws(()=>u.hexToBytes('abc'),TypeError);assert.throws(()=>u.base64ToBytes('@@'),TypeError);
});
test('semantic versions compare prereleases and ranges',()=>{
  assert.equal(u.compareVersion('1.0.0-alpha.1','1.0.0-alpha.2'),-1);assert.equal(u.compareVersion('1.0.0','1.0.0-beta'),1);assert.equal(u.parseVersion('01.0.0'),null);
  assert.ok(u.satisfiesVersion('1.5.0','^1.2.0'));assert.equal(u.satisfiesVersion('2.0.0','^1.2.0'),false);assert.ok(u.satisfiesVersion('1.2.5','>=1.2.0 <2.0.0'));assert.ok(u.satisfiesVersion('1.2.9','~1.2.0'));
});
test('Chinese business helpers validate and mask',()=>{
  assert.ok(u.isChineseIdCard('11010519491231002X'));assert.ok(u.isChineseMobile('19912345678'));assert.ok(u.isBankCard('4111111111111111'));assert.equal(u.isBankCard('4111111111111112'),false);
  assert.equal(u.maskChineseMobile('19912345678'),'199****5678');assert.equal(u.maskChineseIdCard('11010519491231002X'),'110105********002X');
});
test('mask helpers preserve useful edges',()=>{assert.equal(u.maskPhone('13812345678'),'138****5678');assert.equal(u.maskEmail('alice@example.com'),'a****@example.com');assert.equal(u.maskName('张三丰'),'张**');assert.equal(u.maskBankCard('4111111111111111'),'4111********1111')});
test('polling succeeds, times out and validates options',async()=>{let calls=0;assert.equal(await u.poll(()=>++calls,{interval:1,timeout:100,isDone:x=>x===3}),3);await assert.rejects(u.waitUntil(()=>false,{interval:1,timeout:2}),/timed out/);await assert.rejects(u.poll(()=>true,{interval:-1}),RangeError)});
test('schemas parse nested data, optional values, unions and refinements',()=>{const schema=u.objectSchema({name:u.stringSchema().refine(x=>x.length>0,'empty'),age:u.numberSchema(),nick:u.stringSchema().optional(),kind:u.unionSchema([u.literalSchema('a'),u.literalSchema('b')])});assert.deepEqual(schema.parse({name:'A',age:2,kind:'a'}),{name:'A',age:2,nick:undefined,kind:'a'});const bad=schema.safeParse({name:'',age:'x',kind:'c'});assert.equal(bad.success,false);assert.match(bad.error.message,/name/);assert.deepEqual(u.arraySchema(u.numberSchema()).parse([1,2]),[1,2])});
test('signals, computed values and watches notify snapshots',()=>{const count=u.createSignal(1);const doubled=u.computed(()=>count.get()*2,[count]);const seen=[];const stop=u.watch(doubled,(v,p)=>seen.push([v,p]),true);count.set(2);count.set(2);assert.deepEqual(seen,[[2,2],[4,2]]);stop();doubled.dispose();count.set(3);assert.equal(doubled.get(),4)});
test('state machines apply guards, actions and subscriptions',()=>{const machine=u.createStateMachine({initial:'idle',context:{count:0},states:{idle:{start:{target:'running',action:c=>c.count++}},running:{stop:'idle',start:{target:'running',guard:()=>false}}}});const seen=[];machine.subscribe((s,p)=>seen.push([s,p]));assert.ok(machine.send('start'));assert.equal(machine.context.count,1);assert.equal(machine.send('start'),false);assert.ok(machine.send('stop'));assert.deepEqual(seen,[['running','idle'],['idle','running']])});
test('diff creates immutable patches and array set differences',()=>{const left={a:1,n:{x:1},remove:true},right={a:2,n:{x:1,y:2}};const patch=u.objectDiff(left,right);assert.deepEqual(u.applyPatch(left,patch),right);assert.deepEqual(left,{a:1,n:{x:1},remove:true});assert.deepEqual(u.arrayDiff([{x:1},{x:2}],[{x:2},{x:3}]),{added:[{x:3}],removed:[{x:1}]});assert.throws(()=>u.applyPatch({},[{op:'add',path:['missing','x'],value:1}]),/Invalid/)});
test('scheduler respects concurrency, priority for queued work, and idle',async()=>{const scheduler=u.createScheduler(1),order=[];let release;const gate=new Promise(resolve=>release=resolve);const first=scheduler.add(async()=>{order.push('first');await gate});const low=scheduler.add(()=>order.push('low'),0);const high=scheduler.add(()=>order.push('high'),10);assert.equal(scheduler.active,1);assert.equal(scheduler.pending,2);release();await Promise.all([first,low,high]);await scheduler.onIdle();assert.deepEqual(order,['first','high','low']);assert.throws(()=>u.createScheduler(0),RangeError)});
test('unit conversions use documented base factors',()=>{assert.equal(u.convertLength(1,'km','m'),1000);assert.ok(Math.abs(u.convertLength(12,'in','ft')-1)<1e-12);assert.equal(u.convertWeight(1,'kg','g'),1000);assert.equal(u.celsiusToFahrenheit(100),212);assert.equal(u.fahrenheitToCelsius(32),0)});
test('CommonJS and ESM package entries expose matching functions',async()=>{const esm=await import(require('node:url').pathToFileURL(require('node:path').resolve('dist/index.mjs')).href+'?test');assert.equal(typeof esm.unique,'function');assert.deepEqual(esm.unique([1,1,2]),u.unique([1,1,2]));assert.equal(esm.default,'欢迎使用')});
