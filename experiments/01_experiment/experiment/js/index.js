function make_slides(f) {
  var   slides = {};

  slides.i0 = slide({
    name : "i0",
    start: function() {
    exp.startT = Date.now();
    }
  });

  slides.instructions = slide({
    name : "instructions",
    button : function() {
      if ($("#intro_about").is(':hidden')) {
        intro_input_str = $("#intro_audio")[0].value;
        if (intro_input_str == "") {
          $(".err").hide();
          $(".err").html("Please provide a response before continuing.");
          $(".err").fadeIn();
        } else if (!intro_input_str.match(/^hello/i)) {
          $(".err").hide();
          $(".err").html("This doesn't quite match what we expected. Please try again.");
          $(".err").fadeIn();
        } else {
          $(".err").hide();
          $("#intro_about").fadeIn(1000);
        }
      } else {
        exp.go(); //use exp.go() if and only if there is no "present" data.
      }
      
    }
  });

  slides.training = slide({
    name: "training",
    present: exp.stims.training, //every element in exp.stims is passed to present_handle one by one as 'stim'

    present_handle: function (stim) {

      this.stim = stim; // store this information in the slide so you can record it later
      $("audio#" + stim.stimulus)[0].play();

    },

    button: function () {
        
        $(".cont_button").prop('disabled', true)
        this.log_responses();

        /* use _stream.apply(this); if and only if there is
        "present" data. (and only *after* responses are logged) */
        _stream.apply(this);

    },

    log_responses: function () {
      exp.data_trials.push({
        "stage": "training",
        "stim": this.stim.stimulus,
        "stim_metadata": JSON.stringify(this.stim),
        "response": ""
      });

    }
  });

  slides.now_test = slide({
    name: "now_test",
    button: function () {
      exp.go(); //use exp.go() if and only if there is no "present" data.
    }
  });

  slides.testing = slide({
    name : "testing",
    present: exp.stims.testing, //every element in exp.stims is passed to present_handle one by one as 'stim'
    
    present_handle : function(stim) {
      $(".err").hide();
    
      this.stim = stim; // store this information in the slide so you can record it later
      $("audio#" + stim.stimulus)[0].play();

      $("#test_form > input").prop('checked', false)
    },

    button : function() {

      if ($("#test_form > input:checked").length == 0) {
        $(".err").show();
      } else {
        this.log_responses();

        /* use _stream.apply(this); if and only if there is
        "present" data. (and only *after* responses are logged) */
        _stream.apply(this);
      }
    },

    log_responses: function () {
      exp.data_trials.push({
        "stage": "testing",
        "stim": this.stim.stimulus,
        "stim_metadata": JSON.stringify(this.stim),
        "response": parseInt($("#test_form > input:checked").prop('value'))
      });

    }
  });

  slides.subj_info =  slide({
    name : "subj_info",
    submit : function(e){
      exp.subj_data = {
        language : $("#language").val(),
        enjoyment : $("#enjoyment").val(),
        asses : $('input[name="assess"]:checked').val(),
        age : $("#age").val(),
        gender : $("#gender").val(),
        education : $("#education").val(),
        comments : $("#comments").val(),
        problems: $("#problems").val(),
        fairprice: $("#fairprice").val()
      };
      exp.go(); //use exp.go() if and only if there is no "present" data.
    }
  });

  slides.thanks = slide({
    name : "thanks",
    start : function() {
      exp.data= {
          "trials" : exp.data_trials,
          "catch_trials" : exp.catch_trials,
          "system" : exp.system,
          "condition" : exp.condition,
          "subject_information" : exp.subj_data,
          "time_in_minutes" : (Date.now() - exp.startT)/60000
      };
      setTimeout(function() {turk.submit(exp.data);}, 1000);
    }
  });

  return slides;
}

function preload_audio(stimulus) {
  $("#audio_data").append($("<audio>", {
    class: "stimulus",
    id: stimulus,
    src: "audio/" + stimulus + ".wav.mp3",
    loop: false,
    controls: true,
    autoplay: false,
    preload: "auto",
  }));
}

/// init ///
function init() {

  exp.trials = [];
  exp.catch_trials = [];

  exp.stims = replexp_initialize(1,1);

  // flatten into 1-d list, then pre-load audio
  _.map(_.flatten(exp.stims), s => preload_audio(s.stimulus));
  // enable continue only after stimulus audio has played
  $("audio.stimulus").on('ended', e => setTimeout(() => $(".cont_button").prop('disabled', false), 500));

  console.log(exp.stims);
  
  exp.system = {
      Browser : BrowserDetect.browser,
      OS : BrowserDetect.OS,
      screenH: screen.height,
      screenUH: exp.height,
      screenW: screen.width,
      screenUW: exp.width
    };

  //blocks of the experiment:
  exp.structure=["i0", "instructions", "training", "now_test", "testing", 'subj_info', 'thanks'];

  exp.data_trials = [];
  //make corresponding slides:
  exp.slides = make_slides(exp);

  exp.nQs = utils.get_exp_length(); //this does not work if there are stacks of stims (but does work for an experiment with this structure)
                    //relies on structure and slides being defined

  // console.log("exp.nQs")
  // console.log(exp.nQs)

  $('.slide').hide(); //hide everything

  //make sure turkers have accepted HIT (or you're not in mturk)
  $("#start_button").click(function() {
    if (turk.previewMode) {
      $("#mustaccept").show();
    } else {
      $("#start_button").click(function() {$("#mustaccept").show();});
      exp.go();
    }
  });

  exp.go(); //show first slide

}
