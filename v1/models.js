'use strict';
const mongoose = require('mongoose');
mongoose.Promise = global.Promise;


//model for flashcard deck
const DeckSchema = mongoose.Schema ({
	sideA: { type: String, required: true },
	sideB: { type: String, required: true },
});

DeckSchema.methods.serialize = function() {
	return {
		id: this._id,
		sideA: this.sideA,
		sideB: this.sideB,
		nValue: this.nValue
	};
};

const Deck = mongoose.model('Deck', DeckSchema);

module.exports = {Deck};