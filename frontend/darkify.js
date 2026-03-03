const fs = require('fs');
const path = require('path');

const replacements = [
    ['bg-gray-50', 'bg-[#0B1020]'],
    ['bg-gray-100', 'bg-[#1E293B]'],
    ['bg-gray-200', 'bg-[#374151]'],
    ['bg-white/95', 'bg-[#111827]/95'],
    ['bg-white/30', 'bg-[#374151]/30'],
    ['bg-white/20', 'bg-[#374151]/20'],
    ['bg-slate-100', 'bg-[#1E293B]'],
    ['bg-slate-200', 'bg-[#374151]'],
    ['text-gray-900', 'text-[#F9FAFB]'],
    ['text-gray-700', 'text-[#D1D5DB]'],
    ['text-gray-600', 'text-[#9CA3AF]'],
    ['text-gray-500', 'text-[#6B7280]'],
    ['text-gray-400', 'text-[#6B7280]'],
    ['text-gray-300', 'text-[#4B5563]'],
    ['text-slate-900', 'text-[#F9FAFB]'],
    ['text-slate-500', 'text-[#6B7280]'],
    ['text-slate-400', 'text-[#6B7280]'],
    ['text-slate-300', 'text-[#4B5563]'],
    ['text-foreground', 'text-[#F9FAFB]'],
    ['text-muted-foreground', 'text-[#9CA3AF]'],
    ['bg-muted/30', 'bg-[#1E293B]/30'],
    ['bg-muted/50', 'bg-[#1E293B]/50'],
    ['bg-muted/20', 'bg-[#1E293B]/20'],
    ['bg-background', 'bg-[#0B1020]'],
    ['border-background', 'border-[#0B1020]'],
    ['border-gray-200', 'border-[#1E293B]'],
    ['border-gray-100', 'border-[#1E293B]'],
    ['border-gray-300', 'border-[#374151]'],
    ['border-card-border/50', 'border-[#1E293B]/50'],
    ['border-card-border', 'border-[#1E293B]'],
    ['bg-blue-50', 'bg-blue-500/10'],
    ['bg-blue-100', 'bg-blue-500/15'],
    ['bg-indigo-50', 'bg-indigo-500/10'],
    ['bg-indigo-100', 'bg-indigo-500/15'],
    ['bg-emerald-50', 'bg-emerald-500/10'],
    ['bg-amber-50', 'bg-amber-500/10'],
    ['bg-red-50', 'bg-red-500/10'],
    ['bg-red-100', 'bg-red-500/15'],
    ['bg-green-50', 'bg-green-500/10'],
    ['bg-green-100', 'bg-green-500/15'],
    ['bg-purple-50', 'bg-purple-500/10'],
    ['bg-yellow-50', 'bg-amber-500/10'],
    ['text-blue-600', 'text-blue-400'],
    ['text-blue-700', 'text-blue-400'],
    ['text-indigo-600', 'text-indigo-400'],
    ['text-indigo-700', 'text-indigo-400'],
    ['text-emerald-600', 'text-emerald-400'],
    ['text-amber-600', 'text-amber-400'],
    ['text-red-600', 'text-red-400'],
    ['text-green-600', 'text-green-400'],
    ['text-green-700', 'text-green-400'],
    ['text-purple-600', 'text-purple-400'],
    ['text-yellow-800', 'text-amber-400'],
    ['text-yellow-700', 'text-amber-400'],
    ['text-yellow-600', 'text-amber-400'],
    ['shadow-indigo-200', 'shadow-indigo-500/20'],
    ['shadow-emerald-200', 'shadow-emerald-500/20'],
    ['shadow-red-200', 'shadow-red-500/20'],
    ['shadow-blue-200', 'shadow-blue-500/20'],
    ['ring-indigo-100', 'ring-indigo-500/20'],
    ['ring-red-100', 'ring-red-500/20'],
    ['ring-emerald-100', 'ring-emerald-500/20'],
    ['focus:bg-white', 'focus:bg-[#111827]'],
    ['hover:bg-gray-50', 'hover:bg-[#1E293B]'],
    ['hover:bg-gray-100', 'hover:bg-[#1E293B]'],
    ['border-red-100', 'border-red-500/20'],
    ['border-green-100', 'border-green-500/20'],
    ['border-white', 'border-[#111827]'],
];

function walkDir(dir) {
    let files = [];
    if (!fs.existsSync(dir)) return files;
    fs.readdirSync(dir).forEach(f => {
        const full = path.join(dir, f);
        if (fs.statSync(full).isDirectory()) {
            files = files.concat(walkDir(full));
        } else if (full.endsWith('.tsx')) {
            files.push(full);
        }
    });
    return files;
}

const base = path.resolve(__dirname, 'src');
const dirs = [
    path.join(base, 'app', 'passenger'),
    path.join(base, 'app', 'driver'),
    path.join(base, 'app', 'profile'),
    path.join(base, 'components', 'ride-sharing'),
    path.join(base, 'components', 'ride'),
    path.join(base, 'components', 'trip'),
    path.join(base, 'components', 'map'),
    path.join(base, 'components', 'auth'),
];

let totalUpdated = 0;

dirs.forEach(dir => {
    const files = walkDir(dir);
    files.forEach(file => {
        let content = fs.readFileSync(file, 'utf8');
        let original = content;

        content = content.replace(/\bbg-muted\b(?!\/)/g, 'bg-[#1E293B]');
        content = content.replace(/\bhover:bg-muted\b(?!\/)/g, 'hover:bg-[#1E293B]');
        content = content.replace(/\bbg-card\b/g, 'bg-[#111827]');
        content = content.replace(/\bbg-white\b(?!\/)/g, 'bg-[#111827]');

        replacements.forEach(([from, to]) => {
            content = content.split(from).join(to);
        });

        if (content !== original) {
            fs.writeFileSync(file, content, 'utf8');
            console.log('Updated:', path.relative(base, file));
            totalUpdated++;
        }
    });
});

console.log('\nTotal files updated: ' + totalUpdated);
