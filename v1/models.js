'use strict';
const mongoose = require('mongoose');
mongoose.Promise = global.Promise;

const DeckSchema = mongoose.Schema ({
	sideA: String,
	sideB: String,
});

DeckSchema.methods.serialize = function() {
	return {
		sideA: this.sideA,
		sideB: this.sideB,
	};
};

const Deck = mongoose.model('Deck', DeckSchema);

module.exports = {Deck};