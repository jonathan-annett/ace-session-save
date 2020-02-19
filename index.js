
function serialize (editor,cb) {
	try {
		 cb(undefined,(function(session){
			
			return JSON.stringify({
				editor : {
					theme : editor.getTheme().split("/").pop()
				},
				session : {
					value : session.getValue(),
					selection : session.selection.toJSON(),
					options   : session.getOptions(),
					mode	  : session.getMode().$id,
					folds	 : session.getAllFolds().map(function(fold) {
						return {
							start		: fold.start,
							end			: fold.end,
							placeholder : fold.placeholder
						};
					}),
					scrollTop  : session.getScrollTop(),
					scrollLeft : session.getScrollLeft(),
					
					undos : session.getUndoManager().$undoStack.slice(-25),
					redos : session.getUndoManager().$redoStack.slice(-25)
				  
				}
			});
			
		})(editor.getSession()));
	} catch (err) {
		cb(err);
	}
}


function deserialize (editor,json,cb) {
	
	var Range = window.ace.require("ace/range").Range;
	
	function deltaRangeFixup (delta) {
		delta.range = Range.fromPoints(delta.range.start, delta.range.end);
	}
	
	function deltaArrayFixup(element) {
		element.deltas.forEach(deltaRangeFixup);
	}
	
	function stackElementFixup(stackElement) {
		stackElement.forEach(deltaArrayFixup);
	}
	
	function stackArrayFixup(stackArray) {
		if (!stackArray) return [];
		stackArray.forEach(stackElementFixup);
		return stackArray;
	}

	try {
		   cb (undefined,(function(session,state){
	
			editor.setTheme("ace/theme/"+state.editor.theme);
			
			session.setValue(state.session.value);
			session.selection.fromJSON(state.session.selection);
			session.setOptions(state.session.options);
			session.setMode(state.session.mode);
			try {
				state.session.folds.forEach(function(fold){
					session.addFold(fold.placeholder, 
						Range.fromPoints(fold.start, fold.end));
				});
			} catch(e) {
			}
			session.setScrollTop(state.session.scrollTop);
			session.setScrollTop(state.session.scrollLeft);
			
			var undoManager = session.getUndoManager();
			
			undoManager.$doc = session;
			undoManager.$undoStack = stackArrayFixup(state.session.undos);
			undoManager.$redoStack = stackArrayFixup(state.session.redos);
			
		})(editor.getSession(),JSON.parse(json)));
		
	} catch (err) {
		cb(err);
	}
}
  