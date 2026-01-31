export const getUserId = () => {
    let id = window.sessionStorage.getItem('userId');
    if (!id) {
        id = crypto.randomUUID();
        window.sessionStorage.setItem('userId', id);
    }
    return id;
};
