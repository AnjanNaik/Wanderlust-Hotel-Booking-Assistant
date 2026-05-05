try {
  require('./app.js');
} catch(e) {
  require('fs').writeFileSync('error_trace.txt', String(e.stack));
}
