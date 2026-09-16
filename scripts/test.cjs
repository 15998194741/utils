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
