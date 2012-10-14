var io = require('socket.io').listen(8000)
	, exec = require('child_process').exec;

var phpExec = '/usr/bin/php';
io.sockets.on('connection', function(socket) {
	//var cmd = phpExec + ' ./php-bayes/bayes.php --namespace sentiments --mode classify --data "' + encodeURIComponent('kamu suka aku') + '"';
	//var cmd = phpExec + ' ./php-bayes/bayes.php --namespace sentiments --mode train --data "' + encodeURIComponent(JSON.stringify(tr)) + '"';
	
	socket.on('classify', function(data) {
		if(typeof data.words == 'string' && typeof data.namespace == 'string') {
			var start = new Date().getTime();
			
			var cmd = phpExec + ' ./php-bayes/bayes.php --namespace '+ data.namespace +' --mode classify --data "' + encodeURIComponent(data.words) + '"';
			var child = exec(cmd, function(error, stdout, stderr) {
				var json = JSON.parse(stdout);
				socket.emit('classifyDone', {
					'diagnostics': {
						'timeSpent': new Date().getTime() - start,
						'words': data.words
					},
					'classifier': json.data
				});
			});
		}
		else {
			
		}
	});
});