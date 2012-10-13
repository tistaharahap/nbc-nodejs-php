var Bayes = function(options) {
	options = options || {};
	var storeConfig = options.storeConfig || { 
		host: '127.0.0.1',
		port: 6379,
		namespace: 'snbc'
	};
	
	this.store = require('redis').createClient(storeConfig.port, storeConfig.host);
	this.store.async = false;
	this.store.on('error', function(error) {
		console.log('Redis connection error');
	});
	this.namespace = storeConfig.namespace;

	this.ns = {
		trainer:
			this.namespace+'-nbc-trains',
		blacklist:
			this.namespace+'-nbc-blacklists',
		words:
			this.namespace+'-nbc-words',
		sets:
			this.namespace+'-nbc-sets',
		wordSetDelimiter:
			'_-%%--%%-_'
	};
};

Bayes.prototype = {
	calculations: {},
	train: function(texts, set) {
		texts = texts.split(" ");
		if(texts.length > 0) {
			for(i in texts) {
				var word = this.cleanTexts(texts[i]);
				if(word !== "") {
					// Words
					this.store.hincrby(this.ns.words, word,  1);
					this.store.hincrby(this.ns.words, 'count', 1);

					// Sets
					var key = word + this.ns.wordSetDelimiter + set;
					this.store.hincrby(this.ns.words, key, 1);
					this.store.hincrby(this.ns.sets, set, 1);
				}
			}
		}
	},
	
	classify: function(text) {
		console.log('classifying..');
		var result = {
			status: {
				code: 403,
				msg: 'Keywords must not be empty.'
			}
		};

		text = text.toLowerCase();
		var temp = text.split(" ");
		var texts = [];
		if(temp.length > 0) {
			// Cleanups
			for(i in temp) {
				var word = this.cleanTexts(temp[i]);
				if(word !== "")
					texts.push(word);
			}

			var keywordCount = texts.length;
			var score = [];
			var P = [];

			this.getSetCount(function(numberOfSets) {
				P['kws-sum'] = 0;

			});
			P['kws-sum'] = 0;
			for(i in texts) {
				P['kws-sum'] += this.getWordCount(texts[i]);
				console.log("Word count for " + texts[i] + ": " + P['kws-sum']);
			}
			P['kws-sum'] = P['kws-sum'] > 0 ? Math.log(P['kws-sum']) + Math.log(numberOfSets) : 0;

			if(P['kws-sum'] > 0) {
				var sets = this.getAllSets();
			}
		}

		return result;
	},

	getAllSets: function() {
		return this.store.hvals(this.ns.sets);
	},

	getSetCount: function(callback) {
		return this.store.hlen(this.ns.sets, function(err, count) {
			callback(count);
		});
	},

	getWordCount: function(text) {
		this.store.hget(this.ns.words, text, function(err, reply) {
			console.log(reply);
			return reply;
		});
	},

	getAllWordsCount: function() {
		return this.store.hget(this.ns.words, 'count');
	},

	getSetWordCount: function(set) {
		return this.store.hget(this.ns.sets, set);
	},

	getWordCountFromSet: function(text, set) {
		var key = text + this.ns.wordSetDelimiter + set;
		return this.store.hget(this.ns.words, key);
	},

	addToBlacklist: function(text) {
		return this.store.sadd(this.ns.blacklist, text);
	},

	removeFromBlacklist: function(text) {
		return this.store.srem(this.ns.blacklist, text) == 1 ? true : false;
	},

	isBlacklisted: function(text) {
		return this.store.sismember(this.ns.blacklist, text) > 0 ? true : false;
	},

	cleanTexts: function(texts) {
		var temp = texts.replace(/[^0-9a-zA-z]/, '').toLowerCase();
		if(temp != null && temp != '' && !this.isBlacklisted(temp))
			return temp;
		else
			return "";
	}
}

exports.Bayes = Bayes;