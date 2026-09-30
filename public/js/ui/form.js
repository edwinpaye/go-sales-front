import { h } from '../core/dom.js';

/**
 * Build a form from a schema.
 * field: { name, label, type, required, options, placeholder, help, value, min, max, step, rows, hidden }
 * onSubmit(values) — return value / throw to keep modal open.
 */
export function buildForm(schema, onSubmit, { submitLabel = 'Save', cancelLabel = 'Cancel', onCancel } = {}) {
  const form = h('form', { class: 'col gap-4', noValidate: true });
  const inputs = new Map();
  for (const f of schema) {
    if (f.hidden) continue;
    const id = `f-${f.name}`;
    let control;
    const val = f.value ?? '';
    switch (f.type) {
      case 'textarea':
        control = h('textarea', { id, name: f.name, class: 'textarea', rows: f.rows || 3, placeholder: f.placeholder || '', required: f.required });
        control.value = val; break;
      case 'select':
        control = h('select', { id, name: f.name, class: 'select', required: f.required },
          !f.required && h('option', { value: '' }, '—'),
          (f.options || []).map((o) => h('option', { value: o.value, selected: String(o.value) === String(val) }, o.label)),
        ); break;
      default:
        control = h('input', {
          id, name: f.name, class: 'input', type: f.type || 'text',
          placeholder: f.placeholder || '', required: f.required,
          min: f.min, max: f.max, step: f.step,
        });
        control.value = val;
    }
    inputs.set(f.name, control);
    form.appendChild(h('div', { class: 'field' },
      h('label', { for: id }, f.label, f.required && h('span', { style: { color: 'var(--c-danger)', marginLeft: '4px' } }, '*')),
      control,
      f.help && h('div', { class: 'text-xs muted' }, f.help),
    ));
  }
  const error = h('div', { class: 'field-error hidden' });
  form.appendChild(error);
  const btnRow = h('div', { class: 'row', style: { justifyContent: 'flex-end', gap: '8px' } },
    h('button', { type: 'button', class: 'btn', onClick: () => onCancel?.() }, cancelLabel),
    h('button', { type: 'submit', class: 'btn btn--primary' }, submitLabel),
  );
  form.appendChild(btnRow);

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    error.classList.add('hidden');
    const values = {};
    for (const f of schema) {
      const el = inputs.get(f.name); if (!el) continue;
      let v = el.value;
      if (f.type === 'number') v = v === '' ? null : Number(v);
      if (f.transform) v = f.transform(v);
      values[f.name] = v;
    }
    const submit = form.querySelector('button[type=submit]');
    submit.disabled = true;
    try { await onSubmit(values); }
    catch (err) {
      error.textContent = err?.message || String(err);
      error.classList.remove('hidden');
    } finally { submit.disabled = false; }
  });

  return { el: form, inputs };
}