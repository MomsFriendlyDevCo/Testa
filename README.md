@MomsFriendlyDevCo/Testa
========================
Low-overhead, parallel-first testkit harness with dependencies and a Mocha like UI updated for ESM.

```javascript
import test from '@momsfriendlydevco/testa';

test('simple test', ()=> {
	test.expect(1).to.be.ok;
	test.expect(1).to.be.a('number');
});


// Setup tests using a chainable syntax
test('auth').id('auth').do(()=>
    fetch('https://acme.com/auth', {
        method: 'POST',
        headers: {
			Authentication: `Bearer ${config.authToken}`,
        },
    })
);


// Apply dependencies
test('ping')
    .depends('auth') // Wait for the above auth test to complete before we run this
    .slow('30s') // Mark test as running slow if it takes >= 30 seconds
    .timeout('1m') // ... and time it out at 1 minute
    .do(async ()=> {
        /* ... */
    })


// Split multi-step processes up into stages
test('fetch entities', async t => {

    t.stage('fetch users');
    let users = await (await fetch('https://acme.com/api/users')).json();
    t.log('there are', users.length, 'in the system'); // Output supplemental information during a test

    t.stage('fetch projects');
    let projects = await (await fetch('https://acme.com/api/projects')).json();

    if (projects.length == 0)
        t.warn('no projects in system'); // Warn about things without exiting

    t.dump(users); // Dump complex information flows to temporary files to be examined later

    if (projects.length == 0 && users.length == 0)
        return t.skip('need at least 1 user + 1 project to run test'); // Skip out and say why

});


// Usual shortcut syntax applies
test('foo')
    .skip('TODO: Not yet ready') // Don't actually run this, and optionally say why
    .do(()=> /* ... */)

test('foo').only(()=> /* ... */) // Mark that only this test should run

test.before(()=> /* ... */) // Setup a test to run before everything else

test.after(()=> /* ... */) // Setup a test to run after everything else

test.priority(50).do(()=> /* ... */) // Or use priority levels (higher runs first)
```


CLI
---
Install into a project with `npm i @momsfriendlydevco/testa` or run as `npx @momsfriendlydevco/testa`.

```
Usage: testa [options] [files...]

Run testkits in parallel with dependencies

Options:
  -l, --list                       List all queued tests and exit
  -b, --bail                       Stop processing on the first error (implies
                                   `--serial`)
  -s, --serial                     Force run tests in serial (alias of `--limit
                                   1`)
  -p, --parallel <number>          Set number of tests to run in parallel
                                   (default: 5)
  -g, --grep <expression>          Add a grep expression filter for tests titles
                                   + IDs (can be specified multiple times)
                                   (default: [])
  -G, --invert-grep <expression>   Add an inverted grep expression filter for
                                   tests titles + IDs (can be specified multiple
                                   times) (default: [])
  -f, --fgrep <expression>         Add a raw string expression filter for tests
                                   titles + IDs (can be specified multiple
                                   times) (default: [])
  -F, --invert-fgrep <expression>  Add an inverted raw string expression filter
                                   for tests titles + IDs (can be specified
                                   multiple times) (default: [])
  --slow [timestring]              Set the amount of time before a test is
                                   considered slow to resolve. Can be any valid
                                   timestring (default: "75ms")
  --timeout [timestring]           Set the amount of time before a test times
                                   out. Can be any valid timestring (default:
                                   "2s")
  --ui [ui]                        Set the UI environment to use (default:
                                   "bdd")
  --debug                          Turn on various internal debugging output
  -h, --help                       display help for command
```


Reasons
-------
**Another goddamned test library, dear god, why**

Yes it seems annoying that I'm adding to an existing well-trodden ground of testkits here but I was frustrated at some lacking features, namely:

1. No testkit seems to be able to do pre-dependencies correctly - what if one test requires another first? Its common to login or negotiate Auth credentials for some test units, why is the only way to do this screwing around with `before()` blocks or nesting tests?
2. No testkit I've seen puts parallelism first and foremost rather than an afterthought. This library is all about parallel with serial functionality as a secondary choice.
3. Context is outdated - arrow functions should be universal when declaring tests, no need to differentiate between `test(()=> {})` and `test(function() {})` contexts, just accept a universal context as an argument and work from there. This makes stuff like using `t.timeout()` or `t.skip()` much easier without having to care about a "strong" function context rather than arrow functions.
4. `beforeEach()` / `afterEach()` are anti-patterns and should not be supported - especially when we are doing things in parallel.
5. Why can't we say _why_ a test was skipped with `.skip()`?
6. `chai` / `expect()` should ship as standard - yes choice is nice but if thats what everyone uses anyway why bother adding another dependency + import header.
7. Tests should support sub-stages (see `TestaContext.stage()`) to clearly denote where in a long-running or complex test we are up to
8. Tests should be able to easily dump information for inspection without just spewing to the console (see `TestContext.dump()`)
9. Tests can _still_ be serialized on an opt-in basis using `.serial()` - or use `--serial` to force all tests to do this



API
===

test(title:String, handler:Function)
------------------------------------
The main test instanciator. Returns a `Testa` class instance.


test.expect()
-------------
Utility function which exposes a `chai#expect` function.

```javascript
import test from '@momsfriendlydevco/testa';

test('simple test', ()=> {
	test.expect(1).to.be.ok;
	test.expect(1).to.be.a('number');
});
```


Testa
-----
A Testa class instance.


Testa.id(id:String)
-------------------
Specify an ID for a test.
Returns the chainable instance.
Used to specify dependencies or refer to tests.


Testa.location(file:String, line:Number)
----------------------------------------
Indicate the location of the test.
This is automatically populated when using the `testa` bin.
Returns the chainable instance.


Testa.handler(handler:Function)
-------------------------------
Specify the test worker function.
Returns the chainable instance.


Testa.do(handler:Function)
--------------------------
Alias for `Testa.handler()`


Testa.title(title:String)
-------------------------
Specify a human readable title for a test. Used during logging.
Returns the chainable instance.


Testa.describe(description:String)
-------------------------
Add a more verbose description for a test.
Returns the chainable instance.


Testa.skip()
------------
Mark a test for skipping, these will not be run but marked as skipped when logging.
Returns the chainable instance.


Testa.only()
------------
Mark a test for 'only' inclusion. Unless overridden these will be the only tests run.
Returns the chainable instance.


Testa.priority(level:Number|String)
-----------------------------------
Set the priority order of a function.
Level can be a number (higher numbers run first) or a meta string such as 'BEFORE', 'AFTER'
Returns the chainable instance.
The `before()` and `after()` functions are really just aliases of `test.priority('BEFORE', ...)`


Testa.depends(...String)
------------------------
Set a pre-dependency for a test.
This marked test will not run less the dependency has run and successfully resolved first.
Returns the chainable instance.


Testa.before(...String)
-----------------------
Alias for `Testa.depends(...string)`


Testa.postDepends(...String)
----------------------------
Set a post-dependency for a test.
This queues up a _reverse_ dependency where the named tests will execute _after_ this test.
Returns the chainable instance.


Testa.after(...String)
----------------------
Alias for `Testa.postDepends(...string)`


Testa.before()
--------------
Alias for `test().priority('BEFORE', ...)`
Returns the chainable instance.


Testa.after()
-------------
Alias for `test().priority('AFTER', ...)`
Returns the chainable instance.


Testa.slow(timing:String|Number)
--------------------------------
Set the amount of time before a test is considered slow to resolve.
Can be a raw millisecond time or any valid Timestring.
Returns the chainable instance.


Testa.timeout(timing:String|Number)
-----------------------------------
Set the amount of time before a test should timeout.
Can be a raw millisecond time or any valid Timestring.
Returns the chainable instance.


Testa.run()
-----------
Actual test runner.
Creates a TestaContext, runs the handler function with that context and handles errors and general logging.


Testa.depends(...dependency:String)
-----------------------------------
Adds one or more IDs as a pre-dependency before running the test. These must resolve successfully before being able to continue.
Can be specified multiple times.
Returns the chainable instance.


Testa.series(isSeries?:true)
----------------------------
Mark this test as requiring an isolated in-series runner.
This differs from regular tests in that its force to run in a series rather than in massive-parallel - the default Testa behaviour.
Returns the chainable instance.


TestaContext
------------
Context object passed as the functional context + the only argument to all test handler functions.


TestaContext.log(...msg:Any)
----------------------------
Log some test output.
Returns the chainable `TestaContext` instance.


TestaContext.warn(...msg:Any)
-----------------------------
Log some test output as a warning but don't exit the test.
Returns the chainable `TestaContext` instance.


TestaContext.dump(...msg:Any)
-----------------------------
Log some arbitrary output and continue the test.
This is designed mainly for large complex objects which may need to be dissected separately.
Returns the chainable `TestaContext` instance.


TestaContext.stage(...msg:Any)
------------------------------
Signal that we are at a specific sub-stage within a test function.
In most cases this acts as a bookmark.
Returns the chainable `TestaContext` instance.


TestaContext.skip(...msg:Any)
----------------------------
Notify that a test was skipped and indicate why.
Returns the chainable `TestaContext` instance.


TestaContext.wait(delay:Number|String)
--------------------------------------
Wrapper around `timestring()` + `setTimeout()` to wait for an arbitrary amount of time.
Returns a promise which will resolve when the delay has elapsed.
