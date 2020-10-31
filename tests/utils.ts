import * as assert from 'uvu/assert';
import * as utils from '../src/utils/utils';

import { idGen } from './../src/crackwatch/websocket';
import { suite } from 'uvu';

interface TestString {
  value: string;
}

interface RNContext extends TestString {
  fn: typeof utils.getRandomNumber;
}

const getRandomNumber = suite<RNContext>('getRandomNumber', {
  fn: utils.getRandomNumber,
  value: utils.getRandomNumber(),
});

getRandomNumber('Should be a function', (ctx) => {
  assert.type(ctx.fn, 'function');
});

getRandomNumber('Should return string', (ctx) => {
  assert.type(ctx.value, 'string');
});

getRandomNumber('Should have a length of 3', (ctx) => {
  assert.is(ctx.value.length, 3);
});

getRandomNumber('Should be > 0 and < 999', (ctx) => {
  assert.ok(Number.parseInt(ctx.value) > 0);
  assert.ok(Number.parseInt(ctx.value) < 999);
});

getRandomNumber.run();

//=========================

interface RSContext extends TestString {
  fn: typeof utils.getRandomString;
}

const getRandomString = suite<RSContext>('getRandomString', {
  fn: utils.getRandomString,
  value: utils.getRandomString(),
});

getRandomString('Should be a function', (ctx) => {
  assert.type(ctx.fn, 'function');
});

getRandomString('Should return string', (ctx) => {
  assert.type(ctx.value, 'string');
});

getRandomString('Should not be empty', (ctx) => {
  assert.ok(ctx.value.trim().length > 0);
});

getRandomString('Should have a length of 8', (ctx) => {
  assert.is(ctx.value.length, 8);
});

getRandomString.run();

//=====================

interface GUContext extends TestString {
  fn: typeof utils.getUri;
}

const getUri = suite<GUContext>('getUri', {
  fn: utils.getUri,
  value: utils.getUri(),
});

getUri('Should be a function', (ctx) => {
  assert.type(ctx.fn, 'function');
});

getUri('Should return string', (ctx) => {
  assert.type(ctx.value, 'string');
});

getUri('Should not be empty', (ctx) => {
  assert.ok(ctx.value.trim().length > 0);
});

//====================

interface IGContext {
  fn: typeof utils.idGenerator;
}

const idGenerator = suite<IGContext>('idGenerator', {
  fn: utils.idGenerator,
});

idGenerator('Should be a function', (ctx) => {
  assert.type(ctx.fn, 'function');
});

idGenerator('Should return a object', (ctx) => {
  assert.type(ctx.fn(), 'object');
});

idGenerator('Should generate consecutive numbers', (ctx) => {
  const generator = ctx.fn();
  assert.is(generator.next().value, '1');
  assert.is(generator.next().value, '2');
});

idGenerator.run();

//========================

interface RTSContext extends TestString {
  fn: typeof utils.responseToString;
}

const responseToString = suite<RTSContext>('responseToString', {
  fn: utils.responseToString,
  value: utils.responseToString({ msg: 'Testing double quotes "' }),
});

responseToString('Should be a function', (ctx) => {
  assert.type(ctx.fn, 'function');
});

responseToString('Should return string', (ctx) => {
  assert.type(ctx.value, 'string');
});

responseToString('Should be surrounded by []', (ctx) => {
  assert.is(ctx.value[0], '[');
  assert.is(ctx.value.slice(-1), ']');
});

responseToString('Should escape double quotes', (ctx) => {
  assert.match(ctx.value, '\\"');
});

responseToString.run();
