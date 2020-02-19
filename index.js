require("./@")(module,function(window) {
    
    
    var filterHistory = function(deltas){ 
        return deltas.filter(function (d) {
            return d.group != "fold";
        });
    }
    
    var sessionToJSON = function(session) {
        return {
            selection: session.selection.toJSON(),
            value: session.getValue(),
            history: {
                undo: session.$undoManager.$undoStack.map(filterHistory),
                redo: session.$undoManager.$redoStack.map(filterHistory)
            },
            scrollTop: session.getScrollTop(),
            scrollLeft: session.getScrollLeft(),
            options: session.getOptions()
        }
    }
    
    var sessionFromJSON = function(data) {
        var session = ace.createEditSession(data.value);
        session.$undoManager.$doc = session; // workaround for a bug in ace
        session.setOptions(data.options);
        session.$undoManager.$undoStack = data.history.undo;
        session.$undoManager.$redoStack = data.history.redo;
        session.selection.fromJSON(data.selection);
        session.setScrollTop(data.scrollTop);
        session.setScrollLeft(data.scrollLeft);
        return session;
    };
    
    function serialize (editor,omit,cb) {
        if (typeof omit==='function') {
            cb=omit;
            omit=undefined;
        }
        try {
             cb(undefined,(function(session){
                 
            
                var object = {
                    editor : {
                        theme : editor.getTheme().split("/").pop()
                    },
                    session : sessionToJSON(session)
                }
                
                if (omit) {
                    omit.forEach(function(k){delete object.session[k];delete object.editor[k]});
                }
            
                return JSON.stringify(object);
                
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
        
                if (state.editor.theme) {
                    editor.setTheme("ace/theme/"+state.editor.theme);
                }
                
                editor.setSession(sessionFromJSON(state.session));

                
            })(editor.getSession(),JSON.parse(json)));
            
        } catch (err) {
            cb(err);
        }
    }
    
    window.ace_session_json = {
        serialize   : serialize,
        deserialize : deserialize
     };

},["child.html"]);