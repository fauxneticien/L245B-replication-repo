// For debugging in VS Code with Node.js
if (typeof window === 'undefined') {
        // Running debug in Node.js

        // Make sure you have underscore, etc. installed in root folder
        // i.e. there is a 'node_modules' folder somewhere
        var _ = require('underscore');
        var items = require('./stims.js');
} else {
        // Running in browser

}

// Most code taken verbatim from:
// https://github.com/TalLinzen/rapid_phonotactic_generalization/blob/master/experigen/exp1/setup/design.js
//
// All adjustments to port from Experigen playform to ALPS lab framework

// 12 counterbalancing orders, based on Cristia et al 2013 p. 266: 
// the 'attested' onset is the one that's shared between training and testing;
// 'legal' is generalization-conforming but not in the training set;
// 'illegal' is an onset that doesn't conform to the generalization
// (Numbers on the right indicate rows in Cristia et al's table)
counterbalancing = [
        { 'voicing': 'voiced', 'attested': 'g', 'legal': 'b', 'illegal': 'p' }, //1
        { 'voicing': 'voiced', 'attested': 'z', 'legal': 'd', 'illegal': 't' }, //2 
        { 'voicing': 'voiced', 'attested': 'D', 'legal': 'g', 'illegal': 'k' }, //3
        { 'voicing': 'voiced', 'attested': 'd', 'legal': 'v', 'illegal': 'f' }, //4
        { 'voicing': 'voiced', 'attested': 'v', 'legal': 'z', 'illegal': 's' }, //5
        { 'voicing': 'voiced', 'attested': 'b', 'legal': 'D', 'illegal': 'T' }, //6
        { 'voicing': 'voiceless', 'attested': 'k', 'legal': 'p', 'illegal': 'b' },//7
        { 'voicing': 'voiceless', 'attested': 's', 'legal': 't', 'illegal': 'd' },//8
        { 'voicing': 'voiceless', 'attested': 'T', 'legal': 'k', 'illegal': 'g' },//9
        { 'voicing': 'voiceless', 'attested': 't', 'legal': 'f', 'illegal': 'v' },//10
        { 'voicing': 'voiceless', 'attested': 'f', 'legal': 's', 'illegal': 'z' },//11
        { 'voicing': 'voiceless', 'attested': 'p', 'legal': 'T', 'illegal': 'D' },//12
]

replexp_initialize = function (n_exposures, cb_list) {

        n_test_blocks = 2;
        block_size = 5;

        add = function (arr, x) {
                if (arr.indexOf(x) == -1) {
                        arr.push(x);
                }
                return (arr);
        }

        create_block = function (items, all_items, v1_order, v2_order,
                sonorant_order, start_index) {
                var block_order = _.shuffle(items);
                var res = [];
                for (var b = 0; b < items.length; b++) {
                        for (var i = 0; i < all_items.length; i++) {
                                var x = start_index + b;
                                if (all_items[i]['c1'] == block_order[b] &&
                                        all_items[i]['v1'] == v1_order[x] &&
                                        all_items[i]['v2'] == v2_order[x] &&
                                        all_items[i]['n'] == sonorant_order[x]) {
                                        res.push(all_items[i]);
                                        break;
                                }
                        }
                }
                return (res);
        }

        generate_design = function (dis, n_exposures, cb_list) {

                var v1 = []; // ["a", "o", "u", "e", "i"]
                var v2 = []; // ["u", "a", "i"]
                var sonorants = []; // ["l", "m", "n"]

                var training_items = []; // ["d", "D", "g", "v", "z"] (for cb_list = 1)
                var test_items = []; // ["b", "g", "p"]

                // minus 1 since javascript indexes from 0
                // e.g. list number 2 = index 1
                var cb = counterbalancing[cb_list - 1];

                for (var i = 0; i < items.length; i++) {
                        v1 = add(v1, items[i]['v1']);
                        v2 = add(v2, items[i]['v2']);
                        sonorants = add(sonorants, items[i]['n']);
                        c1 = items[i]['c1'];
                        if (items[i]['voicing'] == cb['voicing'] && c1 != cb['legal']) {
                                training_items = add(training_items, c1);
                        }
                }

                test_items = [cb['legal'], cb['attested'], cb['illegal']];

                var n_training_items = 5;
                var n_test_items = test_items.length;
                var n_trials = n_training_items * n_exposures + n_test_items *
                        n_test_blocks;

                var v1_order = [];
                var v2_order = [];
                var sonorant_order = [];
                for (var i = 0; i < n_exposures * 4; i++) {
                        v1_order = v1_order.concat(_.shuffle(v1))
                        v2_order = v2_order.concat(_.shuffle(v2))
                        sonorant_order = sonorant_order.concat(_.shuffle(sonorants))
                }

                v1_order = v1_order.slice(0, n_trials);
                v2_order = v2_order.slice(0, n_trials);
                sonorant_order = sonorant_order.slice(0, n_trials);

                var training_trials = [];
                for (var exposure = 0; exposure < n_exposures; exposure++) {
                        block = create_block(training_items, items, v1_order, v2_order,
                                sonorant_order, exposure * n_training_items);
                        training_trials = training_trials.concat(block);
                }

                var test_trials = [];
                for (var n_block = 0; n_block < n_test_blocks; n_block++) {
                        n = n_exposures * n_training_items + n_test_items * n_block;
                        block = create_block(test_items, items, v1_order, v2_order,
                                sonorant_order, n)
                        test_trials = test_trials.concat(block);
                }

                var types = ['legal', 'illegal', 'attested'];
                for (var i = 0; i < test_trials.length; i++) {
                        for (t = 0; t < types.length; t++) {
                                if (test_trials[i]['c1'] == cb[types[t]]) {
                                        test_trials[i]['condition'] = types[t];
                                }
                        }
                }

                return {
                        "training": training_trials,
                        "testing": test_trials
                }

        }

        return generate_design(this, n_exposures, cb_list);

}
