/* Script for generating task information */


/******************************/
/* Helper Functions*/
/******************************/

function create2darray(num_row, num_col, val){
	/* https://stackoverflow.com/a/46792350 */
	return Array.from(Array(num_row), _ => Array(num_col).fill(val));
}

function createNSeq(N, oneIndexed){
	/* https://stackoverflow.com/a/33352604	*/
	if (oneIndexed){
		return Array.from(Array(N), (_, i) => i + 1);
	}
	else {
		return [...Array(N).keys()];
	}
}

function getAllIndexes(arr, val) {
	/* https://stackoverflow.com/a/20798567 */
    var indexes = [], i;
    for(i = 0; i < arr.length; i++)
        if (arr[i] === val)
            indexes.push(i);
    return indexes;
}

function linspace(startValue, stopValue, cardinality) {
  /* https://stackoverflow.com/a/40475362 */
  var arr = [];
  var step = (stopValue - startValue) / (cardinality - 1);
  for (var i = 0; i < cardinality; i++) {
    arr.push(startValue + (step * i));
  }
  return arr;
}

function transpose(arr){
	return arr[0].map((_, colIndex) => arr.map(row => row[colIndex]));
}

function diff(arr){
	var diff_arr = [];
	for(var i=0; i<arr.length-1; i++){
		diff_arr.push(arr[i+1]-arr[i])
	}
	return diff_arr;
}

/* function for deep copy */
const clone = (items) => items.map(item => Array.isArray(item) ? clone(item) : item);


/******************************/
/* Experimental Variables */
/******************************/

const numtrials = 96;
const numblocks = 8;
const change_angles = [25, 25];

/* 6:Loss block & 3:Gain block */
const block_cue = [6,3,3,6,6,3,6,3];

/* -1:Balanced & +1:Skewed */
var gain_blocks = jsPsych.randomization.shuffle(Array(numblocks*0.25).fill(-1).concat(Array(numblocks*0.25).fill(1)));
var loss_blocks = jsPsych.randomization.shuffle(Array(numblocks*0.25).fill(-1).concat(Array(numblocks*0.25).fill(1)));
var  hemi_rewardcue = new Array(numblocks);
for(var i=0; i<block_cue.length; i++){
	switch(block_cue[i]){
		case 3: 
			hemi_rewardcue[i] = gain_blocks.pop();
			continue;
		case 6:
			hemi_rewardcue[i] = loss_blocks.pop();
	}
}

/* Reward Contingencies */
const r = 7.5;
const nrGain  = {hit: r, 		miss: 0, 		fa: 0, 		  cr: r, 	   noresp: -2*r};
const nrLoss  = {hit: 0, 		miss: -r, 		fa: -r, 	  cr: 0, 	   noresp: -2*r};
const skGain1 = {hit: 2*r*2/3, 	miss: 0, 		fa: 0, 		  cr: 2*r/3,   noresp: -2*r};
const skGain2 = {hit: 2*r/3, 	miss: 0,		fa: 0, 		  cr: 2*r*2/3, noresp: -2*r};
const skLoss1 = {hit: 0, 		miss: -2*r/3,	fa: -2*r*2/3, cr: 0, 	   noresp: -2*2*r};
const skLoss2 = {hit: 0, 		miss: -2*r*2/3,	fa: -2*r/3,	  cr: 0, 	   noresp: -r};

var Contable_nrGain  = new Array(numblocks);
var Contable_nrLoss  = new Array(numblocks);
var Contable_skGain1 = new Array(numblocks);
var Contable_skGain2 = new Array(numblocks);
var Contable_skLoss1 = new Array(numblocks);
var Contable_skLoss2 = new Array(numblocks);
for(i=0; i<numblocks; i++){
	Contable_nrGain[i]  = create2darray(2,2,0);
	Contable_nrLoss[i]  = create2darray(2,2,0);
	Contable_skGain1[i] = create2darray(2,2,0);
	Contable_skGain2[i] = create2darray(2,2,0);
	Contable_skLoss1[i] = create2darray(2,2,0);
	Contable_skLoss2[i] = create2darray(2,2,0);
}

const base_score = (numtrials*0.25)*nrGain.hit*2;
const max_score  = base_score;

/******************************/
/* getTaskDesign */
/******************************/

function getTaskDesign(block){
	var temp_array;
	var trialnum = createNSeq(N=numtrials, oneIndexed=true);
	var n4 = 0.25*numtrials;

	var probe_arr 	= jsPsych.randomization.shuffle(Array(numtrials/2).fill(-1).concat(Array(numtrials/2).fill(1)));
	var left_probe	= getAllIndexes(probe_arr, -1);
	var right_probe = getAllIndexes(probe_arr, 1);

	/* Assigns the reward for LEFT stimulus location to each trial:
	   (-1):balanced (prefixed as 'nr' or non risky) and 1:skewed ('sk')
	   (-6): left nrloss, (6): left skloss (-3): left nrgain, (3): left skgain */
	var reward_cue = new Array(numtrials).fill(hemi_rewardcue[block-1]*block_cue[block-1]);

	/* Assign which skewed contingency shows up on the (6) or (3) 'sk' trials:
	   6/3 => skewed on left side, balanced (nr) on right
	  -6/-3 => skewed on right side, balanced (nr) on left
	*/
	var skew1_idx, skew2_idx, norm_idx;
	if(reward_cue[0]>0){
		temp_array = jsPsych.randomization.shuffle(left_probe);
		skew1_idx  = temp_array.slice(0, left_probe.length/2).sort((a, b) => a - b);
		skew2_idx  = temp_array.slice(left_probe.length/2, left_probe.length).sort((a, b) => a - b);
		norm_idx   = right_probe.slice();
	} else {
		temp_array = jsPsych.randomization.shuffle(right_probe);
		skew1_idx  = temp_array.slice(0, right_probe.length/2).sort((a, b) => a - b);
		skew2_idx  = temp_array.slice(right_probe.length/2, right_probe.length).sort((a, b) => a - b);
		norm_idx   = left_probe.slice();
	}

	/* 1:skew CT1, 2:skew CT2, 0:balanced nrCT */
	var reward_skew_cue = new Array(numtrials);
	for(i=0;i<skew1_idx.length;i++){
		reward_skew_cue[skew1_idx[i]] = 1;
		reward_skew_cue[skew2_idx[i]] = 2;
	}
	for(i=0;i<norm_idx.length;i++){
		reward_skew_cue[norm_idx[i]]  = 0;
	}

	/* 1:skew CT1, 2:skew CT2, 0:balanced nrCT */
	var motif_arr  = [1,2,3,4]; //1:[1,1], 2:[1,0], 3:[0,1], 4:[0,0]
	var rep_nr = numtrials*0.50/motif_arr.length;
	var rep_sk = numtrials*0.25/motif_arr.length;

	/* change motifs must be equal for both skews (i.e. 1:1)
	   change motifs must also be equal for skew & nr (i.e. 1:1 again, yes)
	   e.g. for reward_cue 'left nrloss' -- left shuffles motifs with rep_nr = 12, 
	   right shuffles motifs for each skewed contingency uniformly, so, rep_sk.
	*/
	var change = new Array(numtrials);
	temp_array = [ jsPsych.randomization.repeat(motif_arr, rep_sk), jsPsych.randomization.repeat(motif_arr, rep_sk),
	 jsPsych.randomization.repeat(motif_arr, rep_nr)];
	for(i=0; i<change.length; i++){
		switch(reward_skew_cue[i]){
			case 0:
				change[i] = temp_array[2].pop();
				continue;
			case 1:
				change[i] = temp_array[1].pop();
				continue;
			case 2:
				change[i] = temp_array[0].pop();
		}
	}

	/* Expanded version of change array: 1->[1,1], 2->[1,0], 3->[0,1], 4->[0,0] */
	var change_ = new Array(numtrials);
	for(i=0; i<numtrials; i++){
		switch(change[i]){
			case 1:
				change_[i] = [1, 1];
				continue;
			case 2:
				change_[i] = [1, 0];
				continue;
			case 3:
				change_[i] = [0, 1];
				continue;
			case 4:
				change_[i] = [0, 0];
		}
	}

	var delta = new Array(numtrials);
	for(i=0; i<change.length; i++){
		switch(change[i]){
			case 1:
				delta[i] = [change_angles[0], change_angles[1]];
				continue;
			case 2:
				delta[i] = [change_angles[0], 0];
				continue;
			case 3:
				delta[i] = [0, change_angles[1]];
				continue;
			case 4:	
				delta[i] = [0, 0];
		}
	}

	/* Assigning initial angles (theta) */
	var theta = linspace(15, 75, numtrials);

	// Assigns the tilt of the stimuli BEFORE change: (-1):L tilt and 1:R tilt
	var tilt_stim = transpose([jsPsych.randomization.shuffle(Array(numtrials*0.5).fill(-1).concat(Array(numtrials*0.5).fill(1))) ,
	 jsPsych.randomization.shuffle(Array(numtrials*0.5).fill(-1).concat(Array(numtrials*0.5).fill(1)))]);

	//  Assigns the angles of the stimuli BEFORE change:
	var alpha = new Array(numtrials);
	temp_array = transpose([jsPsych.randomization.shuffle(theta), jsPsych.randomization.shuffle(theta)]);
	for(i=0; i<alpha.length; i++){
		alpha[i] = [tilt_stim[i][0]*temp_array[i][0], tilt_stim[i][1]*temp_array[i][1]];
	}

	// Assigning tilt AFTER change: 0:no change, (-1):L tilt, 1:R tilt
	var changetilt = new Array(numtrials);

	temp_array = [jsPsych.randomization.shuffle(Array(numtrials*0.125).fill(-1).concat(Array(numtrials*0.125).fill(1))),
	jsPsych.randomization.shuffle(Array(numtrials*0.125).fill(-1).concat(Array(numtrials*0.125).fill(1))),
	jsPsych.randomization.shuffle(Array(numtrials*0.125).fill(-1).concat(Array(numtrials*0.125).fill(1))),
	jsPsych.randomization.shuffle(Array(numtrials*0.125).fill(-1).concat(Array(numtrials*0.125).fill(1)))]

	for(i=0; i<changetilt.length; i++){
		switch(change[i]){
			case 1:
				changetilt[i] = [temp_array[0].pop(), temp_array[1].pop()];
				continue;
			case 2:
				changetilt[i] = [temp_array[2].pop(), 0];
				continue;
			case 3:
				changetilt[i] = [0, temp_array[3].pop()];
				continue;
			case 4:
				changetilt[i] = [0, 0];
		}
	}

	// Calculating the change_angle and direction of change
	var delta_ = new Array(numtrials);
	for(i=0;i<numtrials; i++){
		delta_[i] = [changetilt[i][0]*delta[i][0], changetilt[i][1]*delta[i][1]];
	}

	// Assigning the angle AFTER change
	var beta = new Array(numtrials);
	for(i=0; i<numtrials; i++){
		beta[i] = [alpha[i][0]+delta_[i][0], alpha[i][1]+delta_[i][1]];
	}

	/* Assign t_cuestimulus */
	var lambda = 4;
	var exprnd = d3.randomExponential(lambda);
	var t_cuestimulus = new Array();
	var t_cuestim;
	var temp_expval;
	for(i=0; i<20*numtrials; i++){
		temp_expval = t_cuestim_min + exprnd();
		if (temp_expval < t_cuestim_max){
			t_cuestimulus.push(temp_expval);
		}
		if(i==20*numtrials-1){
			if(t_cuestimulus.length<2*numtrials){
				i = 10*numtrials;
			}
		}
	}
	t_cuestimulus = jsPsych.randomization.shuffle(t_cuestimulus).slice(0,numtrials);
	t_cuestim = jsPsych.randomization.shuffle(t_cuestimulus);
	for(i=0; i<t_cuestim.length; i++){
		t_cuestim[i] += t_stimulus;
	}


	/* Generating tables for trials and angle config */

	delta_  = transpose(delta_);
	change_ = transpose(change_);
	alpha 	= transpose(alpha);
	beta 	= transpose(beta);

	var trial_info_table = {
		Block_num: block,
		Trial_num: clone(trialnum),
		Probe: clone(probe_arr),
		Reward_L: clone(reward_cue),
		RewardSkew_Cue: clone(reward_skew_cue),
		Change_Angle_L: clone(delta_[0]),
		Change_Angle_R: clone(delta_[1]),
		Change_L: clone(change_[0]),
		Change_R: clone(change_[1]),
		TimeCueStim: clone(t_cuestim)
	}

	var angle_info_table = {
		Block_num: block,
		Trial_num: clone(trialnum),
		Probe: clone(probe_arr),
		Reward_L: clone(reward_cue),
		Alpha_L: clone(alpha[0]),
		Alpha_R: clone(alpha[1]),
		Delta_L: clone(delta_[0]),
		Delta_R: clone(delta_[1]),
		Beta_L: clone(beta[0]),
		Beta_R: clone(beta[1])
	}

	var shuffle_flag = true;
	var shufseq;
	var probe_diff, change_diff, change_idx, probe_i, change_i;
	// var t =0;
	while(shuffle_flag == true){

		shufseq = jsPsych.randomization.repeat(createNSeq(N=numtrials, oneIndexed=false), 1);
		// console.log("(before ",t,") trial_info_table:", JSON.parse(JSON.stringify(trial_info_table)));

		for(i=0; i< numtrials; i++){
			trial_info_table.Probe[i]			= probe_arr[shufseq[i]];
			trial_info_table.Reward_L[i] 		= reward_cue[shufseq[i]];
			trial_info_table.RewardSkew_Cue[i]  = reward_skew_cue[shufseq[i]];
			trial_info_table.Change_Angle_L[i]  = delta_[0][shufseq[i]];
			trial_info_table.Change_Angle_R[i]  = delta_[1][shufseq[i]];
			trial_info_table.Change_L[i] 		= change_[0][shufseq[i]];
			trial_info_table.Change_R[i] 		= change_[1][shufseq[i]];
			trial_info_table.TimeCueStim[i] 	= t_cuestim[shufseq[i]];

			angle_info_table.Probe[i] 			= probe_arr[shufseq[i]];
			angle_info_table.Reward_L[i] 		= reward_cue[shufseq[i]];
			angle_info_table.Alpha_L[i] 		= alpha[0][shufseq[i]];
			angle_info_table.Alpha_R[i] 		= alpha[1][shufseq[i]];
			angle_info_table.Delta_L[i] 		= delta_[0][shufseq[i]];
			angle_info_table.Delta_R[i] 		= delta_[1][shufseq[i]];
			angle_info_table.Beta_L[i] 			= beta[0][shufseq[i]];
			angle_info_table.Beta_R[i] 			= beta[1][shufseq[i]];
		}

		trialnum 		= clone(trial_info_table.Trial_num);
		probe_arr 		= clone(trial_info_table.Probe);
		reward_cue 		= clone(trial_info_table.Reward_L);
		RewardSkew_Cue  = clone(trial_info_table.RewardSkew_Cue);
		delta_ 			= [clone(trial_info_table.Change_Angle_L), clone(trial_info_table.Change_Angle_R)];
		change_ 		= [clone(trial_info_table.Change_L), clone(trial_info_table.Change_R)];
		t_cuestim 		= clone(trial_info_table.TimeCueStim);
		alpha 			= [clone(angle_info_table.Alpha_L), clone(angle_info_table.Alpha_R)];
		beta 			= [clone(angle_info_table.Beta_L), clone(angle_info_table.Beta_R)];

		// console.log("(after ",t,") trial_info_table:", JSON.parse(JSON.stringify(trial_info_table)));
		// if(t==10){ shuffle_flag=false;}

		probe_diff = diff(trial_info_table.Probe);
		change_idx = [];
		for(i=0; i<numtrials; i++){
			if(trial_info_table.Probe[i] == -1 && trial_info_table.Change_L[i] == 1){
				change_idx.push(i);
			}
		}
		change_diff = diff(change_idx);

		for(probe_i=0; probe_i<(probe_diff.length -2); probe_i++){
			if(probe_diff[probe_i] == 0){
				if(probe_diff[probe_i+1] == 0 && probe_diff[probe_i+2] == 0){
					shuffle_flag = true;
					break;
				}
				else{
					shuffle_flag = false;
					for(change_i=0; change_i<(change_diff.length-2); change_i++){
						if(change_diff[change_i]==1){
							if(change_diff[change_i+1]==1 && change_diff[change_i+2]==1){
								shuffle_flag = true;
								break;
							}
							else{
								shuffle_flag = false;
								continue;
							}
						}
					}
					continue;
				}
			}
		}
	} 

	return [trial_info_table, angle_info_table];
}

/************************************************************/
/* Generate trial & angle information tables for all blocks */
/************************************************************/

var block_info = new Array(numblocks);
block_info[0] = getTaskDesign(block = 1);
block_info[1] = getTaskDesign(block = 2);
block_info[2] = getTaskDesign(block = 3);
block_info[3] = getTaskDesign(block = 4);
block_info[4] = getTaskDesign(block = 5);
block_info[5] = getTaskDesign(block = 6);
block_info[6] = getTaskDesign(block = 7);
block_info[7] = getTaskDesign(block = 8);