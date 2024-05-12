/* Forked from https://pl.wikipedia.org/w/index.php?title=Wikipedysta:AramilFeraxa/ReportSolver.js */
// <nowiki>
$(function () {
    var RS = {};
    const RSConfig = window.RSConfig || {
        allowedPages: []
    };
    window.ReportSolver = RS;
    var wgPageName = mw.config.get('wgPageName');
    RS.summary = ' - with [[User:AramilFeraxa/ReportSolver|ReportSolver]]';
    var MSG = {
        dialogTitle: 'Close with a comment',
        dialogCancel: 'Cancel',
        dialogConfirm: 'Submit',
        dialogMessage: 'Comment:',
        dialogInfo: 'Template and signature will be inserted automatically.'
    };
    RS.setup = function () {
        if ((wgPageName === 'Meta:Requests_for_help_from_a_sysop_or_bureaucrat') || wgPageName.startsWith('Steward_requests/') || RSConfig.allowedPages.includes(wgPageName) || [1, 4, 5, 15, 11, 9].includes(mw.config.get('wgNamespaceNumber'))) {
            $('span.mw-editsection-bracket:first-child').each(function () {
                try {
                    if (this.parentElement.childNodes.length > 1 && this.parentElement.childNodes[1].href) {
                        sectionNumber = this.parentElement.childNodes[1].href.match(/action=edit&section=(\d+)/)[1];
                    }
                    this.after(' | ');
                    $(this).after($('<a href="javascript:void(0)" class="ReportSolver-close" data-section=' + sectionNumber + '>Close discussion</a>'));
                    $(this).after(' | ');
                    $(this).after($('<a href="javascript:void(0)" class="ReportSolver-edit-stale" data-section="' + sectionNumber + '"> (C)</a>'));
                    $(this).after($('<a href="javascript:void(0)" class="ReportSolver-mark-stale" data-section=' + sectionNumber + '>stale</a>'));
                    $(this).after(' | ');
                    $(this).after($('<a href="javascript:void(0)" class="ReportSolver-edit-on-hold" data-section="' + sectionNumber + '"> (C)</a>'));
                    $(this).after($('<a href="javascript:void(0)" class="ReportSolver-mark-on-hold" data-section=' + sectionNumber + '>on hold</a>'));
                    $(this).after(' | ');
                    $(this).after($('<a href="javascript:void(0)" class="ReportSolver-edit-rejected" data-section="' + sectionNumber + '"> (C)</a>'));
                    $(this).after($('<a href="javascript:void(0)" class="ReportSolver-mark-rejected" data-section=' + sectionNumber + '>not done</a>'));
                    $(this).after(' | ');
                    $(this).after($('<a href="javascript:void(0)" class="ReportSolver-edit-done" data-section="' + sectionNumber + '"> (C)</a>'));
                    $(this).after($('<a href="javascript:void(0)" class="ReportSolver-mark-done" data-section=' + sectionNumber + '>Mark as done</a>'));
                } catch (e) {

                }
            });

		$('a.ReportSolver-mark-done').click(function (e) {
		    var sectionNumber = $(this).data('section');
		    $(this).text("Processing...");
		    RS.doEdit(sectionNumber, '{{done}}', 'Marked as done', '+');
		});
		
		$('a.ReportSolver-mark-rejected').click(function (e) {
		    var sectionNumber = $(this).data('section');
		    $(this).text("Processing...");
		    RS.doEdit(sectionNumber, '{{notdone}}', 'Marked as not done', '-');
		});
		
		$('a.ReportSolver-mark-on-hold').click(function (e) {
		    var sectionNumber = $(this).data('section');
		    $(this).text("Processing...");
		    RS.doEdit(sectionNumber, '{{onhold}}', 'Marked as on hold', '!');
		});
		
		$('a.ReportSolver-mark-stale').click(function (e) {
		    var sectionNumber = $(this).data('section');
		    $(this).text("Processing...");
		    RS.doEdit(sectionNumber, '{{stale}}', 'Marked as stale');
		});
		
		$('a.ReportSolver-close').click(function (e) {
		    var sectionNumber = $(this).data('section');
		    $(this).text("Processing...");
		    RS.doEdit(sectionNumber, '{{section resolved|1=~~~~}}', 'Closed');
		});
		
		RS.handleEditButtonClick();
        }
    };

	RS.handleEditButtonClick = function () {
	    $(document).off('click', '[class^="ReportSolver-edit-"]').on('click', '[class^="ReportSolver-edit-"]', function (e) {
	        var sectionNumber = $(this).data('section');
	        var $headline = $('span.mw-headline').eq(sectionNumber - 1);
			var sectionTitle = $headline.clone().find('small').remove().end().text().trim();
	        var pageTitle = mw.config.get('wgPageName');
	        var editSummary, template;
	
	        var classList = $(this).attr('class').split(/\s+/);
	        for (var i = 0; i < classList.length; i++) {
	            if (classList[i].startsWith('ReportSolver-edit-')) {
	                var action = classList[i].substring('ReportSolver-edit-'.length);
	                if (action === 'done') {
	                    template = '{{done}}. ';
	                    editSummary = 'Marked as done';
	                    statusTemplate = 'done';
	                } else if (action === 'rejected') {
	                    template = '{{notdone}}. ';
	                    editSummary = 'Marked as not done';
	                    statusTemplate = 'notdone';
	                } else if (action === 'stale') {
	                    template = '{{stale}}. ';
	                    editSummary = 'Marked as stale';
	                    statusTemplate = 'stale';
	                } else if (action === 'on-hold') {
	                    template = '{{onhold}}. ';
	                    editSummary = 'Marked as on hold';
	                    statusTemplate = 'onhold';
	                }
	                break;
	            }
	        }
	
	        function ReportSolverDialog(config) {
	            ReportSolverDialog.super.call(this, config);
	        }
	        OO.inheritClass(ReportSolverDialog, OO.ui.ProcessDialog);
	
	        ReportSolverDialog.static.name = "ReportSolverDialog";
	        ReportSolverDialog.static.title = MSG.dialogTitle;
	        ReportSolverDialog.static.actions = [
	            {
	                label: MSG.dialogCancel,
	                flags: "safe",
	            },
	            {
	                action: 'submit',
	                label: MSG.dialogConfirm,
	                flags: ["primary", "progressive"]
	            }
	        ];
	
	        ReportSolverDialog.prototype.initialize = function () {
	            ReportSolverDialog.super.prototype.initialize.call(this);
	
	            var rootPanel = new OO.ui.PanelLayout({
	                padded: true,
	                expanded: false,
	            });
	
	            var commentInput = new OO.ui.MultilineTextInputWidget({
	                rows: 5,
	                value: '',
	                placeholder: 'Enter a comment...'
	            });
	            
				var selectedOptionLabel = new OO.ui.LabelWidget({
			    label: "Chosen option: ",
			    classes: ['centered-label']
				});
				
				var editSummaryElement = $("<span>", {
				    html: editSummary,
				    class: "bold-text"
				});
				
				var infoElement = $("<span>", {
				    html: MSG.dialogInfo,
				    class: "red-text"
				});
				
				rootPanel.$element.append(commentInput.$element, infoElement, selectedOptionLabel.$element, editSummaryElement);
				this.$body.append(rootPanel.$element);
				
				mw.util.addCSS(".centered-label { display: flex; align-items: center; justify-content: center; margin: 10px; }");
				mw.util.addCSS(".bold-text { display: flex; align-items: center; justify-content: center; font-weight: bold; margin: 10px }");
				mw.util.addCSS(".red-text { display: flex; color: red; align-items: center; justify-content: center; font-weight: bold; margin: 10px }"); 
	        };
	
			ReportSolverDialog.prototype.getActionProcess = function (action) {
	            var dialog = this;
	            if(action === 'submit') {
	                var comment = this.$body.find('textarea').val();
	                var wikitext = template + comment;
	                RS.doEdit(sectionNumber, wikitext, editSummary, statusTemplate);
	                dialog.close();
	            }
	            return ReportSolverDialog.super.prototype.getActionProcess.call(this, action);
	        };
	
	        var reportSolverDialog = new ReportSolverDialog({
	            size: "large",
	        });
	
	        var windowManager = new OO.ui.WindowManager();
	        $(document.body).append(windowManager.$element);
	        windowManager.addWindows([reportSolverDialog]);
	        windowManager.openWindow(reportSolverDialog);
	    });
	};

	RS.doEdit = function (sectionNumber, comment, editSummary, status) {
	    var $headline = $('span.mw-headline').eq(sectionNumber - 1);
		var sectionTitle = $headline.clone().find('small').remove().end().text().trim();
	    var pageTitle = mw.config.get('wgPageName');
        new mw.Api().get({
            action: 'parse',
            page: pageTitle,
            prop: 'wikitext',
            section: sectionNumber
        }).done(function (result) {
            var wikitext = result.parse.wikitext['*'];
            wikitext = wikitext.replace(/\{\{\s*Status\s*\|\s*[^\|\}]*\s*\}\}/g, '{{Status|' + status + '}}');
			var isCloseAction = (editSummary === 'Closed');
			if (!isCloseAction) {
				comment = comment + '. ~~~~';
			}
            wikitext = wikitext + '\n:' + comment;
            new mw.Api().postWithEditToken({
                action: 'edit',
                title: pageTitle,
                section: sectionNumber,
                text: wikitext,
                summary: '/* ' + sectionTitle + ' */ ' + editSummary + RS.summary,
                minor: true,
                nocreate: true
            }).done(function (result) {
                if (result && result.edit && result.edit.result && result.edit.result === 'Success') {
                    location.reload();
                }
            });
        });
    };

});

mw.loader.using('mediawiki.api', function () {
    $(document).ready(function () {
        window.ReportSolver.setup();
    });
});
// </nowiki>