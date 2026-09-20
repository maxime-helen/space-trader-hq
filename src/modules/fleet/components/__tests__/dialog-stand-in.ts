const escapeHandlers = new WeakMap<HTMLDialogElement, (event: KeyboardEvent) => void>();

export const installDialogStandIn = (): HTMLDialogElement[] => {
  const showModalCalls: HTMLDialogElement[] = [];

  Object.assign(HTMLDialogElement.prototype, {
    showModal(this: HTMLDialogElement) {
      if (this.open) throw new Error('showModal() on an already open dialog');
      showModalCalls.push(this);
      this.open = true;

      const onKeydown = (event: KeyboardEvent) => {
        if (event.key !== 'Escape') return;
        this.dispatchEvent(new Event('cancel'));
        this.close();
      };
      escapeHandlers.set(this, onKeydown);
      this.addEventListener('keydown', onKeydown);
    },
    close(this: HTMLDialogElement) {
      if (!this.open) return;
      this.open = false;

      const onKeydown = escapeHandlers.get(this);
      if (onKeydown) this.removeEventListener('keydown', onKeydown);
      this.dispatchEvent(new Event('close'));
    },
  });

  return showModalCalls;
};
