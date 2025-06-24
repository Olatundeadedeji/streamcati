import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import Login from '../views/Login.vue'
import Dashboard from '../views/Dashboard.vue'
import Contacts from '../views/Contacts.vue'
import Analytics from '../views/Analytics.vue'
import Interviews from '../views/Interviews.vue'
import Interview from '../views/Interview.vue'
import Layout from '../components/Layout.vue'


const routes = [
  {
    path: '/login',
    name: 'Login',
    component: Login,
    meta: { requiresGuest: true }
  },
  {
    path: '/',
    component: Layout,
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        name: 'Dashboard',
        component: Dashboard
      },
      {
        path: '/contacts',
        name: 'Contacts',
        component: Contacts
      },
      {
        path: '/interviews',
        name: 'Interviews',
        component: Interviews
      },
      {
        path: '/analytics',
        name: 'Analytics',
        component: Analytics
      },
      {
        path: '/interview/:contactId',
        name: 'Interview',
        component: Interview,
        props: true
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()
  
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    next('/login')
  } else if (to.meta.requiresGuest && authStore.isAuthenticated) {
    next('/')
  } else {
    next()
  }
})

export default router
