@MomsFriendlyDevCo/Testa
========================
Simple, parrallel-first testkit harness with dependencies and a Mocha like UI, updated for 2025.


**Another goddamned test library, why**
Yes it seems annoying that we're adding to an existing well-trodden ground of test kits here but I was frustraited at some lacking features, namely:

1. No testkit seems to be able to do pre-dependencies correctly - what if one test requires another first. Its common to login or negociated Auth credentials first, why is the only way to do this screwing around with `before()` blocks?
2. No testkit I've seen puts parrallelism first and foremost rather than an afterthought. This library is all about parallel with serial functionality as a secondary choice
3. `beforeEach()` / `afterEach()` are anti-patterns and should not be supported - especially when we are doing things in parallel



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


Testa.priority(level:Number|String)
----------------------------
Set the priority order of a function.
Level can be a number (higher numbers run first) or a meta string such as 'BEFORE', 'BEFORE-EACH', 'AFTER', 'AFTER-EACH'.
Returns the chainable instance.
The `before()` and `after()` functions are really just aliases of `test.priority('BEFORE', ...)`


Testa.before()
--------------
Alias for `test().priority('BEFORE', ...)`
Returns the chainable instance.


Testa.after()
-------------
Alias for `test().priority('AFTER', ...)`
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


TestaContext.skip(...msg:Any)
----------------------------
Notify that a test was skipped and indicate why.
Returns the chainable `TestaContext` instance.
