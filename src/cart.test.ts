import { test } from 'node:test';
import assert from 'node:assert/strict';
import { addItem, readCart, shippingCost, subtotal } from './cart.ts';
const tee = {productId:'everyday-tee',size:'M',color:0,quantity:1};
test('rejects corrupted or invalid saved cart data',()=>{
 assert.deepEqual(readCart('broken'),[]);
 assert.deepEqual(readCart(JSON.stringify([null,{}, {...tee,productId:'unknown'}, {...tee,size:'BAD'}, {...tee,color:99}, {...tee,quantity:-1}])),[]);
});
test('merges matching options, keeps sizes distinct, and caps quantity',()=>{
 const cart=addItem(addItem([],tee),{...tee,quantity:8});
 assert.equal(cart[0].quantity,5);
 assert.equal(addItem(cart,{...tee,size:'L'}).length,2);
 assert.equal(readCart(JSON.stringify([tee,tee]))[0].quantity,2);
});
test('totals use catalog prices and shipping threshold is correct',()=>{
 assert.equal(subtotal([{...tee,quantity:2}]),1780);
 assert.equal(shippingCost(1780),80);
 assert.equal(shippingCost(2500),0);
 assert.equal(shippingCost(0),0);
});
