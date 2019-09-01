import Vue from 'vue';
import Vuex from 'vuex';
import Api from './service/Api';
import axios from 'axios';
import vuetify from './plugins/vuetify';

Vue.use(Vuex)

export default new Vuex.Store({
  state: {
    loading: {
      user: false,
      ui: false
    },
    error: null,
    path: '',
    token: localStorage.getItem('FBidToken') || '',
    screams: [],
    user: {}
  },
  getters: {
    isAuthenticated: state => !!state.token,
    errors: state => state.error,
    userCredentials: state => state.user.credentials,
    screamList: state => state.screams,
    userLikes: state => state.user.likes,
    modals: state => state.modals,
    loadingUser: state => state.loading.user,
    loadingUI: state => state.loading.ui
  },
  mutations: {
    SET_SCREAMS: (state, data) => {
      state.screams = data
    },
    SET_AUTHORIZATION: (state, token) => {
      state.token = token
    },
    SET_USER: (state, data) => {
      state.user = data;
    },
    SET_LAND: (state, pathName) => state.path = pathName,
    SET_ERROR: (state, error) => state.error = error,
    SET_USER_UNAUTHENTICATED: (state, emptyData) => {
      state.user = emptyData;
      state.token = '';
    },
    SET_SCREAM: (state, data) => {
      let index = state.screams.findIndex(scream => scream.screamId === data.screamId)
      Vue.set(state.screams, index, data);
    },
    SET_LIKE: (state, data) => {
      let index = state.user.likes.length
      let likedScream = {
        screamId: data.screamId,
        userHandle: state.user.credentials.handle
      }
      Vue.set(state.user.likes, index, likedScream)
    },
    SET_UNLIKE: (state, data) => {
      let index = state.user.likes.findIndex(scream => scream.screamId === data.screamId);
      Vue.delete(state.user.likes, index)
    },
    SET_MODAL: (state, {name, value}) => { state.modals[name] = value },
    SET_NEW_SCREAM: (state, newScream) => {
      state.screams.unshift(newScream);
      state.loading.user = false;
    },
    SET_LOADING: (state, {name, value}) => state.loading[name] = value,
    SET_DELETE_SCREAM: (state, screamId) => {
      let index = state.screams.findIndex(scream => scream.screamId === screamId)
      Vue.delete(state.screams, index)
    },
    SET_CLEAR_ERROR: (state) => state.error = ''
  },
  actions: {
    GET_SCREAMS: async ({commit, dispatch}) => {
      const response = await Api().get('screams');
      const data = response.data;
      commit('SET_SCREAMS', data)
    },
    SIGN_IN: ({context, dispatch, commit}, {email, password}) => new Promise((resolve, reject) => {
      commit('SET_LOADING', { name: 'user', value: true});
      Api().post('login', { email, password })
      .then((res) => {
        let FBidToken = `Bearer ${res.data.token}`
        dispatch('AUTH_SUCCESS', FBidToken);
        dispatch('FETCH_AUTH_USER');
        commit('SET_LOADING', { name: 'user', value: false});
        resolve();
      })
      .catch((error) => {
        commit('SET_ERROR', error.response.data);
        commit('SET_LOADING', { name: 'user', value: false});
      })
    }),
    
    SIGN_UP: ({context, commit}, formNewUser) => new Promise((resolve, reject) => {
      commit('SET_LOADING', { name: 'user', value: true});
      Api().post('signup', formNewUser)
      .then((res) => {
        let FBidToken = `Bearer ${res.data.token}`
        commit('AUTH_SUCCESS', FBidToken);
        commit('SET_LOADING', { name: 'user', value: false});
        resolve(res);
      })
      .catch((error) => {
        commit('SET_ERROR', error.response.data);
        commit('SET_LOADING', { name: 'user', value: false});
      })
    }),
    LOGOUT_USER: ({commit}) => new Promise((response) => {
      localStorage.removeItem('FBidToken');
      delete axios.defaults.headers.common['Authorization'];
      commit('SET_USER_UNAUTHENTICATED', {})
      response()
    }),
    FETCH_AUTH_USER: ({commit}) =>  {
      // commit('SET_LOADING', { name: 'user', value: true});
      Api().get('user')
      .then((res) => {
        commit('SET_USER', res.data)
      })
      .catch((error) => {
      })
    },
    UPLOAD_IMAGE: ({commit, dispatch}, formData) => {
      Api().post('user/image', formData)
      .then((res) => {
        dispatch('FETCH_AUTH_USER')
      })
      .catch((error) => console.log(error))
    },
    AUTH_SUCCESS: ({commit}, FBidToken) => {
      localStorage.setItem('FBidToken', FBidToken)
      axios.defaults.headers.common['Authorization'] = FBidToken
      commit('SET_AUTHORIZATION', FBidToken);
    },
    EDIT_USER_DETAILS: ({dispatch, commit}, userDetails) => new Promise((resolve, err) => {
      commit('SET_LOADING', { name: 'user', value: true});
      Api().post('user', userDetails)
      .then((res) => {
        dispatch('FETCH_AUTH_USER');
        commit('SET_LOADING', { name: 'user', value: false});
        resolve(res)
      })
      .catch((error) => {
        console.log(error)
        commit('SET_LOADING', { name: 'user', value: false});
      })
    }),
    AUTH_USER: ({ commit }, token) => {commit('SET_AUTHORIZATION', token)},
    LIKE_SCREAM: ({dispatch,commit}, screamId) => {
      Api().get(`scream/${screamId}/like`)
      .then((res) => {
        commit('SET_SCREAM', res.data);
        commit('SET_LIKE', res.data);
      })
    },
    UNLIKE_SCREAM: ({commit}, screamId) => {
      Api().get(`scream/${screamId}/unlike`)
      .then((res) => {
        commit('SET_SCREAM', res.data);
        commit('SET_UNLIKE', res.data);
      })
    },
    POST_NEW_SCREAM: ({commit}, newScream) => new Promise((response, reject) => {
      commit('SET_LOADING', { name: 'user', value: true});
      Api().post('scream', newScream)
      .then((res) => {
        commit('SET_NEW_SCREAM', res.data);
        commit('SET_LOADING', { name: 'user', value: false});
        response()
      })
      .catch((error) => {
        console.log(error)
        commit('SET_LOADING', { name: 'user', value: false});
      })
    }),
    TO_LAND: ({commi}, pathName) => {commit('SET_LAND', pathName)},
    TOGGLE_MODAL_STATE: ({commit}, {name, value}) => commit('SET_MODAL', {name, value}),
    DELETE_SCREAM: ({commit}, screamId) => new Promise(() => {
      commit('SET_LOADING', { name: 'user', value: true});
      Api().delete(`scream/${screamId}/`)
      .then((res) => {
        commit('SET_DELETE_SCREAM', screamId);
        commit('SET_LOADING', { name: 'user', value: false});
      })
      .catch((error) => {
        console.log(error)
        commit('SET_LOADING', { name: 'user', value: false});
      })
    }),
    CLEAR_ERROR: ({commit}) => commit('SET_CLEAR_ERROR')
  }
})
