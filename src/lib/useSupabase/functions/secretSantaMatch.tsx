// https://github.com/FoxUSA/GiftExchange

const RECURSION_LIMIT = 10000;

export const secretSantaMatch = (rules: any, giftCount = 1) => {
	if (!Number.isInteger(giftCount)) {
		throw new Error('Gift count must be a number');
	}

	let noPickPerson = null;

	for (let r = 0; r < RECURSION_LIMIT; r++) {
		//  limit
		// Step 1 load all the options into a map
		const picks: any = {};
		const picked: any = {}; // Acts as a checksum
		for (const person in rules) {
			picks[person] = [];
			picked[person] = 0;
		}

		// Step 2 assign people and remove pics from list
		for (let i = 0; i < giftCount; i++) {
			const alreadyPicked: any = [];

			for (const personWhoIsPicking in rules) {
				const options = [];
				for (const personWhoIsBeingPicked in picks) {
					// Make a list of eligible gift people
					if (
						picks[personWhoIsBeingPicked].length > giftCount ||
						personWhoIsBeingPicked === personWhoIsPicking || // Cannot pick yourself
						picks[personWhoIsPicking].includes(personWhoIsBeingPicked) || // Cannot get the same person twice
						alreadyPicked.includes(personWhoIsBeingPicked) || // Cannot pick an already picked person this round
						(rules[personWhoIsPicking] &&
							rules[personWhoIsPicking].exclude &&
							rules[personWhoIsPicking].exclude.length &&
							rules[personWhoIsPicking].exclude.includes(personWhoIsBeingPicked)) // Cannot be a excluded person
					) {
						continue; // Go to the next person
					}
					options.push(personWhoIsBeingPicked);
				}

				const pick = options[Math.floor(Math.random() * options.length)]; // From https://stackoverflow.com/questions/5915096/get-a-random-item-from-a-javascript-array
				if (!pick) {
					noPickPerson = personWhoIsPicking;
					continue; // null case
				}
				alreadyPicked.push(pick);
				picks[personWhoIsPicking].push(pick);
				picked[pick]++;
			}
		}

		// Test
		let passed = true;
		for (const person in picked) {
			if (picked[person] !== giftCount) {
				// Test to make sure everyone got the same amount
				passed = false;
			}
		}

		if (passed) {
			// console.log('Matches:', picks);
			// console.log('Counts:', picked);

			return picks;
		} else {
			continue; // Throw the computational kitchen sink at it
		}
	}

	throw new Error(`Secret Santa: Failed to generate matches after ${RECURSION_LIMIT} attempts. -- ${noPickPerson}`);
};
