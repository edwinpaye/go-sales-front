import { h } from '../core/dom.js';
import { buildForm } from '../ui/form.js';
import { toastError, toastSuccess } from '../ui/toast.js';

export function renderLogin({ onLogin }) {
  let mode = 'login'; // 'login' | 'register'
  const wrap = h('div', { class: 'login-wrap' });
  const card = h('div', { class: 'card login-card' });
  wrap.appendChild(card);

  const render = () => {
    const isLogin = mode === 'login';
    const schema = isLogin
      ? [
          { name: 'email', label: 'Email', type: 'email', required: true, placeholder: 'you@example.com' },
          { name: 'password', label: 'Password', type: 'password', required: true, placeholder: '••••••••' },
        ]
      : [
          { name: 'email', label: 'Email', type: 'email', required: true },
          { name: 'username', label: 'Username', type: 'text', required: true },
          { name: 'password', label: 'Password', type: 'password', required: true, help: 'Min 8 characters.' },
          {
            name: 'role', label: 'Role', type: 'select', value: 'client',
            options: ['client', 'sales', 'service', 'analyst', 'manager', 'admin']
              .map((v) => ({ value: v, label: v })),
          },
        ];

    const form = buildForm(schema, async (values) => {
      try {
        if (isLogin) {
          await onLogin(values.email, values.password);
          toastSuccess('Welcome back');
        } else {
          await onLogin.register(values);
          toastSuccess('Account created — signing you in');
          await onLogin(values.email, values.password);
        }
      } catch (e) {
        toastError(e?.message || 'Request failed');
        throw e;
      }
    }, { submitLabel: isLogin ? 'Sign in' : 'Create account' });

    // Replace the cancel button with a mode toggle, keep the submit button.
    const btnRow = form.el.lastChild;
    const submitBtn = form.el.querySelector('button[type=submit]');
    btnRow.replaceChildren(
      h('button', {
        type: 'button',
        class: 'btn btn--ghost btn--block',
        onClick: () => { mode = isLogin ? 'register' : 'login'; render(); },
      }, isLogin ? 'Create an account' : 'Back to sign in'),
      submitBtn,
    );

    card.replaceChildren(
      h('div', { class: 'card__body' },
        h('div', { class: 'login-brand' },
          h('div', { class: 'login-brand__logo' }, 'SS'),
          h('h1', null, isLogin ? 'Sign in' : 'Create account'),
          h('p', { class: 'muted text-sm' }, 'Sales System — enterprise console'),
        ),
        form.el,
      ),
    );
  };

  render();
  return wrap;
}