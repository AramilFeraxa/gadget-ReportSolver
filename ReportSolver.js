// <nowiki>
$(function () {
    const RS = {};
    const RSConfig = window.RSConfig || { allowedPages: [] };
    window.ReportSolver = RS;
    const wgPageName = mw.config.get('wgPageName');

    RS.summary = ' - with [[User:AramilFeraxa/ReportSolver|ReportSolver]]';

    const MSG = {
        dialogTitle: 'Close with a comment',
        dialogCancel: 'Cancel',
        dialogConfirm: 'Submit',
        dialogInfo: 'Template and signature will be inserted automatically.'
    };

    const pageConfigs = {
        'Meta:Requests_for_deletion': [
            { class: 'deleted', label: 'Mark as deleted', template: '{{Icon|delete|Deleted}}', summary: 'Deleted', status: 'deleted' },
            { class: 'kept', label: 'kept', template: '{{Icon|keep|Kept}}', summary: 'Kept', status: 'kept' },
            { class: 'redirected', label: 'redirected', template: '{{Icon|redirect|Redirected}}', summary: 'Redirected', status: 'redirected' },
            { class: 'close', label: 'Close discussion', template: '{{section resolved|1=~~~~}}', summary: 'Closed', status: '' }
        ],
        'Steward_requests/Permissions': [
            { class: 'grant', label: 'Mark as granted', template: '', summary: 'Granted temporary permissions', status: 'done' },
            { class: 'done', label: 'done', template: '{{done}}', summary: 'Marked as done', status: 'done' },
            { class: 'rejected', label: 'not done', template: '{{notdone}}', summary: 'Marked as not done', status: 'not done' },
            { class: 'on-hold', label: 'on hold', template: '{{onhold}}', summary: 'Marked as on hold', status: 'onhold' }
        ]
    };

    const defaultConfig = [
        { class: 'done', label: 'Mark as done', template: '{{done}}', summary: 'Marked as done', status: 'done' },
        { class: 'rejected', label: 'not done', template: '{{notdone}}', summary: 'Marked as not done', status: 'not done' },
        { class: 'already-done', label: 'already done', template: '{{already done}}', summary: 'Marked as already done', status: 'already done' },
        { class: 'on-hold', label: 'on hold', template: '{{onhold}}', summary: 'Marked as on hold', status: 'onhold' },
        { class: 'stale', label: 'stale', template: '{{stale}}', summary: 'Marked as stale', status: 'not done' },
        { class: 'withdrawn', label: 'withdrawn', template: '{{withdrawn}}', summary: 'Marked as withdrawn', status: 'withdrawn' },
        { class: 'close', label: 'Close discussion', template: '{{section resolved|1=~~~~}}', summary: 'Closed', status: '' }
    ];

    RS.setup = function () {
        const useDefault = (
            wgPageName === 'Meta:Requests_for_help_from_a_sysop_or_bureaucrat' ||
            wgPageName.startsWith('Steward_requests/Global') ||
            RSConfig.allowedPages.includes(wgPageName) ||
            [1, 4, 5, 15, 11, 9].includes(mw.config.get('wgNamespaceNumber'))
        );

        const config = useDefault ? defaultConfig : pageConfigs[wgPageName] || [];

        $('span.mw-editsection-bracket:first-child').each(function () {
            try {
                const sectionNumber = $(this).siblings('a').attr('href').match(/section=(\d+)/)[1];
                config.slice().reverse().forEach(option => {
                    $(this).after(' | ');
                    $(this).after($('<a>', {
                        href: 'javascript:void(0)',
                        class: `ReportSolver-edit-${option.class}`,
                        'data-section': sectionNumber,
                        text: ' (C)'
                    }));
                    $(this).after($('<a>', {
                        href: 'javascript:void(0)',
                        class: `ReportSolver-mark-${option.class}`,
                        'data-section': sectionNumber,
                        text: option.label
                    }));
                });
            } catch (e) { console.error(e); }
        });

        config.forEach(option => {
            $(`a.ReportSolver-mark-${option.class}`).click(function () {
                const sectionNumber = $(this).data('section');
                $(this).text('Processing...');
                if (option.class === 'grant') {
                    RS.openGrantDialog(sectionNumber);
                } else {
                    RS.doEdit(sectionNumber, option.template, option.summary, option.status);
                }
            });
        });

        RS.handleEditButtonClick();
    };

    RS.handleEditButtonClick = function () {
        $(document).off('click', '[class^="ReportSolver-edit-"]').on('click', '[class^="ReportSolver-edit-"]', function () {
            const sectionNumber = $(this).data('section');
            const action = $(this).attr('class').split('ReportSolver-edit-')[1];
            const config = [...defaultConfig, ...(pageConfigs[wgPageName] || [])].find(c => c.class === action);
            RS.openDialog(sectionNumber, config);
        });
    };
    
    RS.openDialog = function (sectionNumber, config) {
        function ReportSolverDialog(config) {
            ReportSolverDialog.super.call(this, config);
        }
        OO.inheritClass(ReportSolverDialog, OO.ui.ProcessDialog);

        ReportSolverDialog.static.name = "ReportSolverDialog";
        ReportSolverDialog.static.title = MSG.dialogTitle;
        ReportSolverDialog.static.actions = [
            { label: MSG.dialogCancel, flags: "safe" },
            { action: 'submit', label: MSG.dialogConfirm, flags: ["primary", "progressive"] }
        ];

        ReportSolverDialog.prototype.initialize = function () {
            ReportSolverDialog.super.prototype.initialize.call(this);
            var rootPanel = new OO.ui.PanelLayout({ padded: true, expanded: false });

            var commentInput = new OO.ui.MultilineTextInputWidget({ rows: 5, placeholder: 'Enter a comment...' });
            var selectedOptionLabel = new OO.ui.LabelWidget({ label: "Chosen option:", classes: ['centered-label'] });
            var editSummaryElement = $("<span>", { html: config.summary, class: "bold-text " + config.class });
            var infoElement = $("<span>", { html: MSG.dialogInfo, class: "red-text" });

            rootPanel.$element.append(commentInput.$element, infoElement, selectedOptionLabel.$element, editSummaryElement);
            this.commentInput = commentInput;
            this.$body.append(rootPanel.$element);

            const styles = [
                { class: "centered-label", css: "display: flex; align-items: center; justify-content: center; margin: 10px;" },
                { class: "bold-text", css: "display: flex; align-items: center; justify-content: center; font-weight: bold; margin: 10px;" },
                { class: "red-text", css: "display: flex; color: lightblue; align-items: center; justify-content: center; font-weight: bold; margin: 10px;" },
                { class: "done", css: "color: green;" },
                { class: "rejected", css: "color: red;" },
                { class: "already-done", css: "color: green;" },
                { class: "on-hold", css: "color: blue;" },
                { class: "stale", css: "color: orange;" },
                { class: "withdrawn", css: "color: purple;" },
                { class: "deleted", css: "color: red;" },
                { class: "kept", css: "color: green;" },
                { class: "redirected", css: "color: orange;" },
                { class: "close", css: "color: gray;" }
            ];

            styles.forEach(style => mw.util.addCSS(`.${style.class} { ${style.css} font-weight: bold; margin: 10px; }`));
        };

        ReportSolverDialog.prototype.getActionProcess = function (action) {
            var dialog = this;
            if (action === 'submit') {
                var comment = dialog.commentInput.getValue();
                var wikitext = config.template + (comment ? ' ' + comment : '');
                RS.doEdit(sectionNumber, wikitext, config.summary, config.status);
            }
            return ReportSolverDialog.super.prototype.getActionProcess.call(this, action);
        };

        var dialog = new ReportSolverDialog({ size: "large" });
        var windowManager = new OO.ui.WindowManager();
        $(document.body).append(windowManager.$element);
        windowManager.addWindows([dialog]);
        windowManager.openWindow(dialog);
    };



    RS.openGrantDialog = function (sectionNumber) {
        OO.ui.prompt('Number of months for temporary permission:', { textInput: { placeholder: 'Months' } })
            .done(function (months) {
                months = parseInt(months);
                if (months > 0) {
                    const date = new Date();
                    date.setMonth(date.getMonth() + months);
                    const y = date.getFullYear(), m = ('0' + (date.getMonth() + 1)).slice(-2), d = ('0' + date.getDate()).slice(-2);
                    const wikitext = `{{TempSysop|${months}|${y}|${m}|${d}||automsg=1}} ~~~~`;
                    RS.doEdit(sectionNumber, wikitext, 'Granted temporary permissions', 'done');
                }
            });
    };


    RS.doEdit = function (sectionNumber, comment, editSummary, status) {
        var $editSectionLink = $('span.mw-editsection a[href$="&section=' + sectionNumber + '"]');
        var $mwEditSection = $editSectionLink.closest('.mw-editsection');
        var $headline = $mwEditSection.prevAll('.mw-headline').first();

        if ($headline.length === 0) {
            $headline = $mwEditSection.prevAll('h1, h2, h3, h4, h5, h6').first();
        }
        var sectionTitle = $headline.attr('id').replace(/_/g, ' ');
        const pageTitle = mw.config.get('wgPageName');
        new mw.Api().postWithEditToken({
            action: 'parse', page: pageTitle, prop: 'wikitext', section: sectionNumber
        }).done(function (result) {
            let wikitext = result.parse.wikitext['*'];
            if (editSummary === 'Closed') {
                wikitext += '\n' + comment;
            } else if (['Deleted', 'Kept', 'Redirected'].includes(editSummary)) {
                comment = comment.trim();
                if (!/[.!?]$/.test(comment)) comment += '.';
                comment += ' ~~~~';
                wikitext += '\n----\n' + comment;
            } else {
                wikitext = wikitext.replace(/\{\{\s*[Ss]tatus\s*(?:\|[^}]*)?\}\}/g, '{{Status|' + status + '}}');
                comment = comment.trim();
                if (!comment.endsWith('.')) comment += '.';
                comment += ' ~~~~';
                if (/\{\{(sr-request|SRUC|CU request|interwiki request)/i.test(wikitext)) {
                    wikitext = wikitext.replace(/\|\s*[Ss]tatus\s*=\s*[^|]*\|/i, '|status = ' + status + '\n |');
                }
                wikitext += '\n:' + comment;
            }
            new mw.Api().postWithEditToken({
                action: 'edit', title: pageTitle, section: sectionNumber, text: wikitext,
                summary: '/* ' + sectionTitle + ' */ ' + editSummary + RS.summary, minor: true, nocreate: true
            }).done(() => location.reload());
        });
    };

    mw.loader.using('mediawiki.api', () => $(RS.setup));
});
// </nowiki>