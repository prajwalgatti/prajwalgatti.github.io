/* Script to define the experiment timeline */

/******************************/
/* Experiment functions */
/******************************/

function generateGaborStimulus(b_num, t_num, size) {
	if(t_num == numtrials){
		b_num++;
		t_num = 0;
		if(b_num >= numblocks){
			return undefined;
		}
	}
	var contrast = 100.0;
	var spatial_freq = 35;
	var sigma = size/7;
	var phase = 0;
	var initial_angles = [block_info[b_num][1].Alpha_L[t_num],
						  block_info[b_num][1].Alpha_R[t_num]];
	var change_angles = [block_info[b_num][1].Delta_L[t_num],
						 block_info[b_num][1].Delta_R[t_num]];
	var stim_arr = [gaborgen(initial_angles[0], spatial_freq, sigma, phase, contrast, size), 
					gaborgen(initial_angles[1], spatial_freq, sigma, phase, contrast, size)];
	(change_angles[0] != 0) ? stim_arr.push(gaborgen(initial_angles[0]+change_angles[0], spatial_freq, sigma, phase, contrast, size)) : stim_arr.push(0);
	(change_angles[1] != 0) ? stim_arr.push(gaborgen(initial_angles[1]+change_angles[1], spatial_freq, sigma, phase, contrast, size)) : stim_arr.push(0);
	return stim_arr;
}

function drawStimuli(stim, gabor_posn_left, gabor_posn_right){
	var canvas, context;
	canvas = document.getElementById('stimulusCanvas');
	context = canvas.getContext('2d');
	context.drawImage(stim[0], x=gabor_posn_left[0], y=gabor_posn_left[1]);
	context.drawImage(stim[1], x=gabor_posn_right[0], y=gabor_posn_right[1]);
};

function drawStimuliChange(stim, gabor_posn_left, gabor_posn_right){
	var canvas, context;
	canvas = document.getElementById('stimChangeCanvas');
	context = canvas.getContext('2d');
	(stim[2] != 0) ? context.drawImage(stim[2], x=gabor_posn_left[0], y=gabor_posn_left[1]) :
		context.drawImage(stim[0], x=gabor_posn_left[0], y=gabor_posn_left[1]);
	(stim[3] != 0) ? context.drawImage(stim[3], x=gabor_posn_right[0], y=gabor_posn_right[1]) :
		context.drawImage(stim[1], x=gabor_posn_right[0], y=gabor_posn_right[1]);
};

function getstim_probe(){
	var probe = block_info[block_num][0].Probe[trial_num];
	var right_probe_path = ''+(cx+2)+','+(cy+probe_width)+' '+ (cx+2+2*probe_height)+','+(cy)+' '+(cx+2)+','+(cy-probe_width)+'';
	var left_probe_path = ''+(cx-2)+','+(cy+probe_width)+' '+ (cx-2-2*probe_height)+','+(cy)+' '+(cx-2)+','+(cy-probe_width)+'';
	if(probe == -1){
		return '<polygon class="probe-fill"  points= "'+ left_probe_path +'"/><polygon class="probe-empty" points= "'+ right_probe_path +'"/>'; 
	}
	else if(probe == 1){
		return '<polygon class="probe-empty" points= "'+ left_probe_path +'"/><polygon class="probe-fill"  points= "'+ right_probe_path +'"/>';
	}
};

/******************************/
/* Variables */
/******************************/
var block_num=0, trial_num=0;
const ResponseCode = {
	no_change_key: 73, /* 73: i/I */
	change_key: 77 /* 77: m/M*/
};

const NoRespThreshold = 5; // Set value to Infinity to disable
var NoRespCounter = 0;
var reset_block = false;
var PPI;
//generate first trial's stimuli
var stim = generateGaborStimulus(block_num, trial_num, stim_size);

/* Init experiment variables*/
var score_arr = [];
var score = {trial: 0, total: 0, gi: 0, li: 0, gf: 0,
			la: 0, net: 0, netgi: 0, netla: 0};
var feedback_text, Resp;

/******************************/
/* Experiment Phases/Nodes */
/******************************/

var fullscr = {
    type:'fullscreen',
    fullscreen_mode: true
};

var get_PPI = {
	type: 'resize',
	item_width: 3 + 3/8,
	item_height: 2+ 1/8,
	prompt: "<p>Click and drag the lower right corner of the box until the box is the same size as a credit card held up to the screen.</p>",
	on_finish: function(data){
		PPI = data.pixels_unit_screen;
	}
};

var confirm_PPI = {
	type: 'image-button-response',
	stimulus: 'img/cns.jpg',
	stimulus_width: function(){
		return PPI*4;
	},
	choices: ['Recalibrate', 'Proceed'],
	prompt: '<p>If scaling worked, then the image above should be 4 inches wide.<br>If not, please recalibrate.</p>',
	on_finish: function(){
		distance_from_screen = set_dimensions(PPI);
	}
};

var dist_from_screen_instruction = {
	type: 'html-button-response',
	stimulus: function(){
		return 'Please position your head ' + distance_from_screen + 'cm away from the screen.<br><br>';
	},
	choices: ['Done']
};

var welcome = {
    type: 'html-keyboard-response',
    stimulus: 'Welcome to the experiment.',
    data: {test_part: 'Welcome'},
    trial_duration: t_welcome_scr,
    on_start: function() {
    	$('body').css({
    		'cursor':'none',  /* Disable cursor during the experiment */
    		'background-color':'rgb(127, 127, 127)'
    	});
    }
};

var begin_block = {
	type: 'html-keyboard-response',
	stimulus: 'Press any key to begin the block.',
	trial_duration: wait_forblock,
	post_trial_gap: t_startblockin,
    data: {test_part: 'Begin_block'}
};

var mid_block_break = {
	type: 'html-keyboard-response',
	stimulus: 'BREAK. Maintain position. Press any key to skip.',
	trial_duration: t_resumeblockin,
    data: {test_part: 'Mid_block_break'}
};

var inter_block_break = {
	type:'html-keyboard-response',
	stimulus: 'Next block starts soon.',
	trial_duration: t_interblockbreak,
	choices: jsPsych.NO_KEYS,
    data: {test_part: 'Inter_block_break'},
	on_finish: function(){
		score_arr.push(score);
		score = {trial: 0, total: 0, gi: 0, li: 0, gf: 0,
			la: 0, net: 0, netgi: 0, netla: 0};
	}
};

var inter_trial_break = {
	type: 'custom-call-function',
	stimulus: function(){
    	return '<svg>' +
			    '<circle class="reward-cue-left"  style="fill:'+rewardcolors[block_num][0]+';"/>'+
			    '<circle class="reward-cue-right" style="fill:'+rewardcolors[block_num][1]+';"/>'+
    			'</svg>';
    		},
    async: true,
    data: {test_part: 'Inter_trial_break'},
    func: function(done){
        setTimeout(done, t_intertrialbreak);
		stim.length = 0;
		stim = generateGaborStimulus(block_num, trial_num+1, stim_size);
    }
};

var reset_block_instruction = {
	type: 'custom-call-function',
	stimulus: 'No Response limit reached. Restarting the block.',
	data:{test_part: 'Reset_block'},
	async: true,
	func: function(done){
		setTimeout(done, t_noresp_reset);
		stim.length = 0;
		stim = generateGaborStimulus(block_num, 0, stim_size);
	},
	on_finish: function(){
		score = {trial: 0, total: 0, gi: 0, li: 0, gf: 0,
			la: 0, net: 0, netgi: 0, netla: 0};
	}
};

var fixation_phase = {
    type: 'html-keyboard-response',
    stimulus: function() {
    	return '<svg><circle class="fixation-point" cx="'+fixation_point_attr.cx+'" cy="'+fixation_point_attr.cy+'" r="'+fixation_point_attr.r+'"/>' +
			    '<circle cx="'+reward_cue_L_attr.cx+'" cy="'+reward_cue_L_attr.cy+'" r="'+reward_cue_L_attr.r+'" fill="'+rewardcolors[block_num][0]+'"/>'+
			    '<circle cx="'+reward_cue_R_attr.cx+'" cy="'+reward_cue_R_attr.cy+'" r="'+reward_cue_R_attr.r+'" fill="'+rewardcolors[block_num][1]+'"/>'+
    			'</svg>';
    },
    choices: jsPsych.NO_KEYS,
    trial_duration: t_fixation,
    data : {test_part: 'fixation'}
};

var stimulus_and_cue_phase = {
    type: 'html-keyboard-response',
    stimulus: function(){
    	return	'<canvas id="stimulusCanvas" width="'+ window_w +'" height="'+ window_h +'"></canvas>' +
    			'<svg>' +
    			'<circle class="fixation-point" cx="'+ fixation_point_attr.cx +'" cy="'+ fixation_point_attr.cy +'" r="'+ fixation_point_attr.r +'"/>' + 
			    '<circle cx="'+reward_cue_L_attr.cx+'" cy="'+reward_cue_L_attr.cy+'" r="'+reward_cue_L_attr.r+'" fill="'+rewardcolors[block_num][0]+'"/>'+
			    '<circle cx="'+reward_cue_R_attr.cx+'" cy="'+reward_cue_R_attr.cy+'" r="'+reward_cue_R_attr.r+'" fill="'+rewardcolors[block_num][1]+'"/>'+
    			'</svg>';
    },
    trial_duration: function(){
    	return block_info[block_num][0].TimeCueStim[trial_num];
    },
    choices: jsPsych.NO_KEYS,
    data : {test_part: 'stimulus_and_cue'},
    on_load: function(){
    	drawStimuli(stim, gabor_posn_left, gabor_posn_right);
    },
    on_finish: function(data){
    	data.stimulus = '';
    }
};

var blank_phase = {
    type: 'html-keyboard-response',
    stimulus: function(){
    	return	'<svg>' +
			    '<circle class="fixation-point" cx="'+ fixation_point_attr.cx +'" cy="'+ fixation_point_attr.cy +'" r="'+ fixation_point_attr.r +'"/>' +
			    '<circle cx="'+reward_cue_L_attr.cx+'" cy="'+reward_cue_L_attr.cy+'" r="'+reward_cue_L_attr.r+'" fill="'+rewardcolors[block_num][0]+'"/>'+
			    '<circle cx="'+reward_cue_R_attr.cx+'" cy="'+reward_cue_R_attr.cy+'" r="'+reward_cue_R_attr.r+'" fill="'+rewardcolors[block_num][1]+'"/>'+
			    '</svg>';
    },
    choices: jsPsych.NO_KEYS,
    trial_duration: t_blank,
    data : {test_part: 'blank'}
};

var stimulus_change_phase = {
    type: 'html-keyboard-response',
    stimulus: function(){
    	return 	'<canvas id="stimChangeCanvas" width="'+ window_w +'" height="'+ window_h +'"></canvas>' +
    			'<svg>' +
			    '<circle class="fixation-point" cx="'+ fixation_point_attr.cx +'" cy="'+ fixation_point_attr.cy +'" r="'+ fixation_point_attr.r +'"/>' + 
			    '<circle cx="'+reward_cue_L_attr.cx+'" cy="'+reward_cue_L_attr.cy+'" r="'+reward_cue_L_attr.r+'" fill="'+rewardcolors[block_num][0]+'"/>'+
			    '<circle cx="'+reward_cue_R_attr.cx+'" cy="'+reward_cue_R_attr.cy+'" r="'+reward_cue_R_attr.r+'" fill="'+rewardcolors[block_num][1]+'"/>'+
			    '</svg>'; 
    },
    trial_duration: t_change,
    choices: jsPsych.NO_KEYS,
    data : {test_part: 'Change'},
    on_load: function(){
    	drawStimuliChange(stim, gabor_posn_left, gabor_posn_right);
    },
    on_finish: function(data){
    	data.stimulus = '';
    }
};

var probe_and_response_phase = {
    type: 'html-keyboard-response',
    stimulus: function(){
    	return	'<svg>' +
    			getstim_probe() +
			    '<circle class="fixation-point" cx="'+ fixation_point_attr.cx +'" cy="'+ fixation_point_attr.cy +'" r="'+ fixation_point_attr.r +'"/>' +
			    '<circle cx="'+reward_cue_L_attr.cx+'" cy="'+reward_cue_L_attr.cy+'" r="'+reward_cue_L_attr.r+'" fill="'+rewardcolors[block_num][0]+'"/>'+
			    '<circle cx="'+reward_cue_R_attr.cx+'" cy="'+reward_cue_R_attr.cy+'" r="'+reward_cue_R_attr.r+'" fill="'+rewardcolors[block_num][1]+'"/>'+
			    '</svg>';
    },
    trial_duration: t_response,
    choices: [ResponseCode.no_change_key, ResponseCode.change_key],
    data: {test_part: 'Probe_and_response'},
    on_finish: function(data){
    	[score, feedback_text, Resp] = assessResponse(data.key_press, ResponseCode, block_num, trial_num, score);
    }
};

var response_feedback_gap = {
	type: 'html-keyboard-response',
	stimulus: function(){
    	return	'<svg>' +
    			'<circle class="fixation-point" cx="'+ fixation_point_attr.cx +'" cy="'+ fixation_point_attr.cy +'" r="'+ fixation_point_attr.r +'"/>' + 
			    '<circle cx="'+reward_cue_L_attr.cx+'" cy="'+reward_cue_L_attr.cy+'" r="'+reward_cue_L_attr.r+'" fill="'+rewardcolors[block_num][0]+'"/>'+
			    '<circle cx="'+reward_cue_R_attr.cx+'" cy="'+reward_cue_R_attr.cy+'" r="'+reward_cue_R_attr.r+'" fill="'+rewardcolors[block_num][1]+'"/>'+
			    '</svg>';
	},
    data: {test_part: 'Response_feedback_gap'},
	choices: jsPsych.NO_KEYS,
	trial_duration: function(){
		return block_info[block_num][0].TimeRespFB_Break[trial_num];
	}
};

var feedback_phase = {
	type: 'audio-keyboard-response',
	stimulus: function(){
		return getAudioFeedback(Resp);
	},
	trial_duration: t_feedback,
	prompt: function(){
		return '<svg>'+
		    '<svg id="feedback-pie-chart" x="'+pie_attr.x+'" y="'+pie_attr.y+'" width="'+pie_attr.width+'" height="'+pie_attr.height+'" viewBox="-1 -1 2 2"></svg>' + 
			    '<circle cx="'+reward_cue_L_attr.cx+'" cy="'+reward_cue_L_attr.cy+'" r="'+reward_cue_L_attr.r+'" fill="'+rewardcolors[block_num][0]+'"/>'+
			    '<circle cx="'+reward_cue_R_attr.cx+'" cy="'+reward_cue_R_attr.cy+'" r="'+reward_cue_R_attr.r+'" fill="'+rewardcolors[block_num][1]+'"/>'+
		    '</svg>'+
		    '<p style="position:relative;z-index:1;">'+feedback_text+'</p>';
	},
	choices: jsPsych.NO_KEYS,
    data: {test_part: 'Feedback'},
	on_load: function(){
		drawPieFeedback(score, block_num, trial_num);
	},
	on_finish: function(){
    	console.log(`block: ${block_num}...trial: ${trial_num}`); /* Debug code (Remove later) */
    }
};

var cumulative_feedback = {
	type: 'html-keyboard-response',
	stimulus: function(){
		return '<p class="score-text" style="transform:translateY('+score_text_attr.y+');">Total Score</p>' +
			'<svg>'+
		    '<svg id="feedback-pie-chart" x="'+pie_attr.x+'" y="'+pie_attr.y+'" width="'+pie_attr.width+'" height="'+pie_attr.height+'" viewBox="-1 -1 2 2"></svg>' + 
			    '<circle cx="'+reward_cue_L_attr.cx+'" cy="'+reward_cue_L_attr.cy+'" r="'+reward_cue_L_attr.r+'" fill="'+rewardcolors[block_num][0]+'"/>'+
			    '<circle cx="'+reward_cue_R_attr.cx+'" cy="'+reward_cue_R_attr.cy+'" r="'+reward_cue_R_attr.r+'" fill="'+rewardcolors[block_num][1]+'"/>'+
		    '</svg>'+
		    '<p style="position:relative;z-index:1;">'+get_cumulative_feedback_text(score.total)+'</p>';
	},
	trial_duration: t_cumulative_fb,
	choices: jsPsych.NO_KEYS,
    data: {test_part: 'Cumulative_feedback'},
	on_load: function(){
		drawCumulativePieFeedback();
	},
	post_trial_gap: t_post_cumulative_fb_gap
}; 


var if_mid_block = {
	timeline: [mid_block_break],
	conditional_function: function(){
		if(trial_num == (numtrials*0.5)-1){
			return true;
		}
		else {
			return false;
		}
	}
};

var if_end_block = {
	timeline: [cumulative_feedback, inter_block_break],
	conditional_function: function(){
		if(trial_num == numtrials-1 && reset_block != true){
			return true;
		}
		else{
			return false;
		}
	}
};

var if_reset_block = {
	timeline: [reset_block_instruction],
	conditional_function: function(){
		if(reset_block){
			return true;
		}
		else {
			return false;
		}
	}
};

/************************************/
/* Generate experiment timeline */
/************************************/

var measure_PPI_loop_node = {
	timeline: [get_PPI, confirm_PPI],
	loop_function: function(){
		var choice = jsPsych.data.get().last(1).values()[0].button_pressed;
		if(choice == 1){
			return false;
		}
		else if(choice == 0){
			return true;
		}
	}
};

var trial_timeline = [fixation_phase, stimulus_and_cue_phase, blank_phase, stimulus_change_phase,
 probe_and_response_phase, response_feedback_gap, feedback_phase, inter_trial_break, if_mid_block];

var trial_loop_node = {
	timeline: trial_timeline,
	loop_function: function(){
		if(Resp == 'NoResp'){
			/* No Response Handler */
			if(++NoRespCounter == NoRespThreshold){
				reset_block = true;
				return false;
			}
		}
		if(trial_num == numtrials-1){
			return false;
		}
		else{
			trial_num++;
			return true;
		}
	}
};

var block_timeline = [begin_block, trial_loop_node, if_end_block, if_reset_block];

var block_loop_node = {
	timeline: block_timeline,
	loop_function: function(){
		NoRespCounter = 0; // Reset No Response counter
		if(reset_block){
			reset_block = false;
			trial_num = 0;
			return true;
		}
		if(block_num<numblocks){
			trial_num = 0;
			block_num++;
			return true;
		} else{
			return false;
		}
	}
};

var experiment_timeline = [fullscr, measure_PPI_loop_node, dist_from_screen_instruction, welcome, block_loop_node];