Case = {
    setWarnings(out, str) {
        var warnings = [];
        if (['.','!'].some(function(k) {
            return str.indexOf(k) >= 0
        })) {
            warnings.push('Most punctuation is discouraged for brevity\n"Mr Bond" instead of "Mr. Bond"');
        }
        if (str.indexOf('?')!=-1) {
            warnings.push('Prefer declarative assertions\n"Meat is murder" instead of "Is meat murder?"');
        }
        if (str.trim().length != str.length) {
            warnings.push('Trailing or leading whitespace detected');
        }

        out.set(warnings);
    },
    setHeight(txtArea, btn) {
        // TODO adjust textarea height
    },
};
