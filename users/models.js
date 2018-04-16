'use strict';
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
mongoose.Promise = global.Promise;

const UserSchema = mongoose.Schema({
	username: {
		type: String,
		required: true,
		unique: true
	},
	password: {
		type: String,
		required: true
	},
	deck: [{
		sideA: {type: String, required: true},
		sideB: {type: String, required: true},
		nValue: {type: Number, default: 1, required: true},
		nextCard: {type: Number},
		currentCard: {type: Number, default: 0},
		correctCount: {type: Number, default: 0},
		incorrectCount: {type: Number, default: 0}
	}]
});

UserSchema.methods.serialize = function() {
	return {
		id: this._id,
		username: this.username,
		deck: this.deck,
		nextCard: this.nextCard,
		currentCard: this.currentCard,
		correctCount: this.correctCount,
		incorrectCount: this.incorrectCount
	};
};

UserSchema.methods.validatePassword = function(password) {
	return bcrypt.compare(password, this.password);
};

UserSchema.statics.hashPassword = function(password) {
	return bcrypt.hash(password, 10);
};

const User = mongoose.model('User', UserSchema);

module.exports = { User };