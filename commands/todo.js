
const formatDate = (isoString) => {
    if (!isoString) return "-";
    const date = new Date(isoString);
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    const h = String(date.getHours()).padStart(2, '0');
    const i = String(date.getMinutes()).padStart(2, '0');
    return `${m}/${d} ${h}:${i}`;
};

const getComponentType = (type) => {
    switch (type) {
        case 'commons': return '강의';
        case 'assignment': return '과제';
        case 'quiz': return '퀴즈';
        default: return `${type}`;
    }
};

module.exports = {
    name: "todo",
    help: "usage : todo [term]",
    async execute(lms, args) {
        if (!lms.isLoggedIn()) {
            console.log("\x1b[31m[ERROR] 로그인이 필요합니다.\x1b[0m");
            return;
        }
    }
}
