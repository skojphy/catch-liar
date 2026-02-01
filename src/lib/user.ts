export type UserProfile = {
    userId: string; 
    nickname: string;
    avatar: string;
    isKakao: boolean;
};

export const getUserProfile = (): UserProfile | null => {
    const data = window.sessionStorage.getItem('user_profile');
    if (data) {
        return JSON.parse(data);
    }
    return null;
};

export const saveUserProfile = (profile: UserProfile) => {
    window.sessionStorage.setItem('user_profile', JSON.stringify(profile));
    window.sessionStorage.setItem('userId', profile.userId);
    window.localStorage.setItem('nickname', profile.nickname);
};

export const logout = () => {
    window.sessionStorage.removeItem('user_profile');
    window.sessionStorage.removeItem('userId');
};

export const getUserId = () => {
    const profile = getUserProfile();
    if (profile) return profile.userId;

    let id = window.sessionStorage.getItem('userId');
    if (!id) {
        id = crypto.randomUUID();
        window.sessionStorage.setItem('userId', id);
    }
    return id;
};
