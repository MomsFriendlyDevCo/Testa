@MomsFriendlyDevCo/Testa
========================
Simple, parrallel-first testkit harness with test dependencies and a Mocha like UI, updated for 2025.


**Another goddamned test library, why**
Yes it seems annoying that we're adding to an existing well-trodden ground of test kits here but I was frustraited at some lacking features, namely:

1. No testkit seems to be able to do pre-dependencies correctly - what if one test requires another first. Its common to login or negociated Auth credentials first, why is the only way to do this screwing around with `before()` blocks?
2. No testkit I've seen puts parrallelism first and foremost rather than an afterthought. This library is all about parallel with serial functionality as a secondary choice.
3. Context is outdated - arrow functions should be universal when declaring tests, no need to differenciate between `test(()=> {})` and `test(function() {})` contexts, just accept a universal context as an argument and work from there.
4. `beforeEach()` / `afterEach()` are anti-patterns and should not be supported - especially when we are doing things in parallel.
5. Give reasons when using `.skip()` - why can't we say _why_ a test was skipped?
6. `chai` / `expect()` should ship as standard - yes choice is nice but if thats what everyone uses anyway...
7. Tests should support sub-stages (see `TestaContext.stage()`) to clearly denote where in a long-running or complex test we are up to
8. Tests should be able to easily dump information for inspection without just spewing to the console (see `TestContext.dump()`)



API
===

test(title:String, handler:Function)
------------------------------------
The main test instanciator. Returns a `Testa` class instance.


Testa
-----
A Testa class instance.


Testa.id(id:String)
-------------------
Specify an ID for a test.
Returns the chainable instance.
Used to specify depdendencies or refer to tests.


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
Mark a test for 'only' inclusion. Unless overriden these will be the only tests run.
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
Can be a raw millisecond time or any valid timestring.
Returns the chainable instance.


Testa.timeout(timing:String|Number)
-----------------------------------
Set the amount of time before a test should timeout.
Can be a raw millisecond time or any valid timestring.
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
This is designed mainly for large complex objects which may need to be disected seperately.
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
Wrapper around timestring() + setTimeout() to wait for an arbitrary amount of time.
Returns a promise which will resolve when the delay has elapsed.
