import React, { useState, useEffect } from 'react';
import { Bell, BellOff } from 'lucide-react';

const REMINDER_STORAGE_KEY = 'memorizakids_reminder_scheduled';

const ReminderManager = () => {
  const [permission, setPermission] = useState('default');
  const [isRequesting, setIsRequesting] = useState(false);

  const showReminderNotification = () => {
    const notification = new Notification('Hora de praticar! 🧠', {
      body: 'Um versículo por dia mantém a memória afiada. Vamos revisar o de hoje?',
      tag: 'memorizakids-reminder',
    });

    notification.onclick = () => {
      window.focus();
    };
  };

  const scheduleNextReminder = () => {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(now.getDate() + 1);
    tomorrow.setHours(9, 0, 0, 0); // Agenda para as 9h de amanhã

    localStorage.setItem(REMINDER_STORAGE_KEY, tomorrow.toISOString());
    console.log(`Lembrete agendado para: ${tomorrow.toLocaleString()}`);
  };

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPermission(Notification.permission);

      if (Notification.permission === 'granted') {
        const scheduledTimeISO = localStorage.getItem(REMINDER_STORAGE_KEY);
        if (scheduledTimeISO) {
          const scheduledTime = new Date(scheduledTimeISO);
          if (new Date() > scheduledTime) {
            showReminderNotification();
            scheduleNextReminder();
          }
        }
      }
    }
  }, []);

  const handleGrantedPermission = () => {
    new Notification('Lembretes ativados! ✅', {
      body: 'Você receberá sua primeira notificação amanhã às 9h.',
    });

    alert('Lembretes diários ativados! Você receberá uma notificação todos os dias para praticar.');
    scheduleNextReminder();
  };

  const requestPermission = async () => {
    console.log('Tentando solicitar permissão de notificação...');
    setIsRequesting(true);

    const promptTimeout = setTimeout(() => {
      // This check runs after a delay. If permission is still 'default',
      // it's likely the browser silently blocked the prompt.
      if (Notification.permission === 'default') {
        alert('O pedido de permissão não apareceu? Às vezes, o navegador bloqueia essa janela por segurança. Por favor, ative as notificações manualmente nas configurações do site (clicando no ícone de cadeado 🔒 na barra de endereço).');
        setIsRequesting(false);
      }
    }, 5000); // 5-second timeout

    if (typeof window !== 'undefined' && 'Notification' in window) {
      try {
        const newPermission = await Notification.requestPermission();
        clearTimeout(promptTimeout);
        console.log('Resultado da permissão:', newPermission);
        setPermission(newPermission);
        if (newPermission === 'granted') {
          handleGrantedPermission();
        }
      } catch (error) {
        clearTimeout(promptTimeout);
        console.error('Erro ao solicitar permissão de notificação:', error);
        alert('Ocorreu um erro ao tentar ativar os lembretes. Por favor, verifique as configurações do seu navegador.');
      } finally {
        setIsRequesting(false);
      }
    } else {
      clearTimeout(promptTimeout);
      console.warn('API de notificação não suportada neste navegador.');
      alert('Seu navegador não suporta notificações.');
      setIsRequesting(false);
    }
  };

  const handleToggleReminders = () => {
    console.log(`Botão de lembrete clicado. Permissão atual: ${permission}`);
    if (permission === 'default') {
      requestPermission();
    } else if (permission === 'granted') {
      alert('Os lembretes já estão ativados. Para desativar, gerencie as permissões de notificação nas configurações do seu navegador.');
    } else if (permission === 'denied') {
      alert('As notificações estão bloqueadas. Para ativar, mude as permissões nas configurações do seu navegador.');
    }
  };

  const getButtonState = () => {
    switch (permission) {
      case 'granted':
        return {
          Icon: Bell,
          text: 'Lembretes Ativos',
          className: 'text-green-400 hover:text-green-300',
        };
      case 'denied':
        return {
          Icon: BellOff,
          text: 'Lembretes Bloqueados',
          className: 'text-red-400 cursor-not-allowed',
        };
      default:
        return {
          Icon: Bell,
          text: isRequesting ? 'Aguardando...' : 'Ativar Lembretes',
          className: 'text-indigo-300 hover:text-white',
        };
    }
  };

  if (typeof window === 'undefined' || !('Notification' in window)) {
    return null;
  }

  const { Icon, text, className } = getButtonState();

  return (
    <button
      onClick={handleToggleReminders}
      disabled={permission === 'denied' || isRequesting}
      className={`text-sm font-medium flex items-center gap-1 transition-colors ${className}`}
    >
      <Icon size={20} />
      <span className="hidden sm:inline">{text}</span>
    </button>
  );
};

export default ReminderManager;
