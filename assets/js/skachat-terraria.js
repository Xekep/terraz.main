(() => {
  const addressButtons = [
    document.querySelector('#copy-address'),
    ...document.querySelectorAll('[data-copy-address]'),
  ].filter(Boolean);

  const feedback = document.querySelector('#copy-feedback');
  let feedbackTimer = 0;

  const setFeedback = (message) => {
    if (!feedback) return;

    window.clearTimeout(feedbackTimer);
    feedback.textContent = message;
    feedbackTimer = window.setTimeout(() => {
      feedback.textContent = '';
    }, 2200);
  };

  const copyText = async (value) => {
    if (navigator.clipboard?.writeText && window.isSecureContext) {
      await navigator.clipboard.writeText(value);
      return;
    }

    const textarea = document.createElement('textarea');
    textarea.value = value;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.append(textarea);
    textarea.select();

    const copied = document.execCommand('copy');
    textarea.remove();

    if (!copied) {
      throw new Error('Copy command failed');
    }
  };

  addressButtons.forEach((button) => {
    const initialLabel = button.textContent.trim();

    button.addEventListener('click', async () => {
      const address = button.dataset.address || button.dataset.copyAddress;
      if (!address) return;

      try {
        await copyText(address);
        button.textContent = 'Скопировано';
        button.classList.add('is-copied');
        setFeedback(`Адрес ${address} скопирован`);

        window.setTimeout(() => {
          button.textContent = initialLabel;
          button.classList.remove('is-copied');
        }, 1800);
      } catch (error) {
        setFeedback(`Скопируйте адрес вручную: ${address}`);
      }
    });
  });
})();
