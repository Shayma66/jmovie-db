var interval = 5000;
var statusReloadErrorCounter = 0;
var statusReloadId;

$(document).ready(function(){
	/* start status timer */
	resetInterval(interval);
	addAutocompleteSearchBox();
	addAutocompleteTagBox();
	
	
	addBrowseJS();
	addSettingsActions();
	addAllJS();
	
	var myOverlay = new overlay('myId', 'myDataName');
	myOverlay.appendTo($('body'));
	
	
	var imagewallArr = [];
	$('.showImagewall').click(function(){
		$('#allView table tr a, #moviesView table tr a, #seriesView table tr a').each(function(){
			var item = {'title' : $(this).text(), 'imgDef' : $(this).data('image'), 'imgBig' : $(this).data('image'), 'href' : '?action=fileDetails&fileId=' + $(this).data('id')};
			if(item){
				imagewallArr.push(item);
			}
		});
		var myImagewall = new imagewall(myOverlay, imagewallArr, 154, 231);
		myOverlay.show();
	});
	
});

function addAllJS(){
	/* sortable table with http://joequery.github.io/Stupid-Table-Plugin/ */
	var date_from_string = function(str){
	    var resultValue;
	    var pattern = '([0-9]{2})\.([0-9]{2})\.([0-9]{4})\ ([0-9]{2}):([0-9]{2}):([0-9]{2})';
	    if(str.match(pattern)){
	        var re = new RegExp(pattern);
	        var DateParts = re.exec(str).slice(1);
	        resultValue = new Date(DateParts[2], DateParts[1], DateParts[0], DateParts[3], DateParts[4], DateParts[5]);
	    } else {
	        resultValue = -1;
	    }
	    return resultValue;
	};
	
	$(".gallery a").fancybox({
		'transitionIn'	:	'elastic',
		'transitionOut'	:	'elastic',
		'speedIn'		:	600, 
		'speedOut'		:	200, 
		'overlayShow'	:	true
	});
	
}

function addBrowseJS(){
	$('.keyList').each(function(){
		var tabs = $(this).find('li');
		var tables = $(this).nextAll('table');
		tables.filter(':first').show();
		tabs.filter(':first').addClass('active');
	
		$(this).find('li').click(function(){
		    var key = $(this).find('a').html();
		    tabs.removeClass('active');
		    $(this).addClass('active');
		    tables.hide();
		    tables.filter('.key_' + key).show();
		});
	});
}

function addSettingsActions(){
	if($('#searchSettings, #listSettings').length){
		$('#searchSettings, #listSettings').find('select').each(function(){
			$(this).change(function(){
				$(this).parents('form:first').submit();
			});
		});
	}
}

function addAutocompleteSearchBox(){
	if($('#searchStr').length){
	
		function split(val) {
			return val.split(/,\s*/);
		}
		function extractLast(term) {
			return split(term).pop();
		}
	
		var cache = {};
		$('#searchStr').autocomplete({
			minLength: 2,
			multiple : true,
			multipleSeparator : ', ',
			source: function( request, response ) {
				var term = request.term;
				if ( term in cache ) {
					response( cache[ term ] );
					return;
				}
				$.getJSON("json.html?action=autocompleteSearch", request, function( data, status, xhr ) {
					cache[term] = data;
					response(data);
				});
			}
		});
	}
}

function addAutocompleteTagBox(){
	if($('#tagSearch').length){
	
		function split(val) {
			return val.split(/,\s*/);
		}
		function extractLast(term) {
			return split(term).pop();
		}
	
		var cache = {};
		$('#tagSearch').autocomplete({
			minLength: 2,
			multiple : true,
			multipleSeparator : ', ',
			source: function( request, response ) {
				var term = request.term;
				if ( term in cache ) {
					response( cache[ term ] );
					return;
				}
				$.getJSON("json.html?action=autocompleteTags", request, function( data, status, xhr ) {
					cache[term] = data;
					response(data);
				});
			},
			select: function( event, ui ) {
				console.log( ui.item ?
				"Selected: " + ui.item.value + " aka " + ui.item.id :
				"Nothing selected, input was " + this.value );
			}
		});
		
		$('#tagSearch').keyup(function(event) {
			var keyCode = typeof(event.which) != 'undefined' ? event.which : event.keyCode;
		    if (keyCode == 13) {
		        event.preventDefault();
				$.getJSON("json.html?action=addTag", {'value' : $('#tagSearch').val(), 'fileId' : $('input[name="fileId"]').val()}, function( data, status, xhr ) {
					var title = $('<span />', {
						'class' : 'tagTitle',
						'text' : data.name
					});

					var link = $('<a />', {
						'href' : 'ajax.html?action=removeTagFromFile&fileTagId=' + data.id,
						'text' : 'entfernen'
					});
					
					var remove = $('<span />', {
						'class' : 'removeTag',
						'html' : link
					});
					
					var li = $('<li />').append(title).append(remove);
					
					$('#tagList ul').append(li);
				});
		    }
		});
		
		$('#tagContainer').on('click', '.removeTag a', function(event){
		    var link = $(this).attr('href');
		    var thisElem = $(this);
		    
			$.ajax({
				type: "POST",
				url: link,
				success: function(data) {
					thisElem.parents('li').remove();
				},
				error: function(data){
					alert('An error occured: ' + data);
				}
			});
		    
		    return false;
		});
		
	}
}

function resetInterval(inInterval){
	if(typeof(statusReloadId) != 'undefined'){
		clearInterval(statusReloadId);
	}
	interval = inInterval;
	statusReloadId = window.setInterval(function() {
		loadStatus()
	}, inInterval);
}

function loadStatus(){
	$.ajax({
		type: "POST",
		url: "/ajax.html?action=getStatus",
		timeout : interval-10,
		success: function( msg ) {
			statusReloadErrorCounter = 0;
			var message = $.trim(msg);
			if(message != ''){
				$('#status').html(message);
			}
			if(interval != interval){
				resetInterval(interval);
			}
		},
		error: function( XMLHttpRequest, textStatus, errorThrown ) {
			if(XMLHttpRequest.readyState == 0 && XMLHttpRequest.status == 0){
				statusReloadErrorCounter++;
				$('#status').html('<p>Konnte keine Verbindung aufbauen. JMovieDB scheint nicht erreichbar zu sein.' + (statusReloadErrorCounter > 1 ? ' Tried ' + statusReloadErrorCounter + ' times.' : '') + '</p>');
				if(interval != interval*10){
					resetInterval(interval*10);
				}
				
				if(statusReloadErrorCounter >= 10){
					if(interval != interval*60){
						resetInterval(interval*60);
					}
				}
			}
		},
	});
}
