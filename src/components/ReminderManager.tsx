import React, { useState, useEffect } from 'react';
import { Bell, BellOff, Settings } from 'lucide-react';
import ReminderTimeModal from './ReminderTimeModal';

const REMINDER_STORAGE_KEY = 'memorizakids_reminder_scheduled';
const REMINDER_CONFIG_KEY = 'memorizakids_reminder_config';

const ReminderManager = () => {
  const [permission, setPermission] = useState('default');
  const [isRequesting, setIsRequesting] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [reminderConfig, setReminderConfig] = useState(() => {
    const saved = localStorage.getItem(REMINDER_CONFIG_KEY);
    return saved ? JSON.parse(saved) : { hour: 9, minute: 0 };
  });

  const showReminderNotification = () => {
    const notification = new Notification('Hora de praticar! 🧠', {
      body: 'Um versículo por dia mantém a memória afiada. Vamos revisar o de hoje?',
      tag: 'memorizakids-reminder',
    });

    notification.onclick = () => {
      window.focus();
    };
  };

  const scheduleNextReminder = (config = reminderConfig) => {
    const now = new Date();
    const next = new Date(now);

    // Configura para o horário definido (hoje)
    next.setHours(config.hour, config.minute, 0, 0);

    // Se o horário já passou hoje, agenda para amanhã
    if (next <= now) {
      next.setDate(now.getDate() + 1);
    }

    localStorage.setItem(REMINDER_STORAGE_KEY, next.toISOString());
    console.log(`Lembrete agendado para: ${next.toLocaleString()}`);
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
      body: `Você receberá sua primeira notificação no horário definido (${reminderConfig.hour.toString().padStart(2, '0')}:${reminderConfig.minute.toString().padStart(2, '0')}).`,
    });

    scheduleNextReminder();
    setIsModalOpen(true); // Abre o modal logo após ativar para deixar o usuário escolher o horário
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
      setIsModalOpen(true);
    } else if (permission === 'denied') {
      alert('As notificações estão bloqueadas. Para ativar, mude as permissões nas configurações do seu navegador.');
    }
  };

  const handleSaveTime = (hour: number, minute: number) => {
    const newConfig = { hour, minute };
    setReminderConfig(newConfig);
    localStorage.setItem(REMINDER_CONFIG_KEY, JSON.stringify(newConfig));
    scheduleNextReminder(newConfig);
    setIsModalOpen(false);

    alert(`Ótimo! Agora você receberá lembretes todos os dias às ${hour.toString().padStart(2, '0')}h${minute.toString().padStart(2, '0')}m.`);
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
    <>
      <button
        onClick={handleToggleReminders}
        disabled={permission === 'denied' || isRequesting}
        className={`group text-sm font-medium flex items-center gap-1 transition-all ${className}`}
        title={permission === 'granted' ? "Ajustar horário do lembrete" : ""}
      >
        <div className="relative">
          <Icon size={20} />
          {permission === 'granted' && (
            <div className="absolute -top-1 -right-1 bg-indigo-500 rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
              <Settings size={8} className="text-white" />
            </div>
          )}
        </div>
        <span className="hidden sm:inline">
          {permission === 'granted' ? `${reminderConfig.hour.toString().padStart(2, '0')}:${reminderConfig.minute.toString().padStart(2, '0')}` : text}
        </span>
      </button>

      <ReminderTimeModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveTime}
        initialHour={reminderConfig.hour}
        initialMinute={reminderConfig.minute}
      />
    </>
  );
};

export default ReminderManager;
