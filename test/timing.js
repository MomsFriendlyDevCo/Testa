import test from '#testa';

// Mark all endpoints as having a 10s timeout + 3s slow time
test.slow('3s').timeout('10s');
