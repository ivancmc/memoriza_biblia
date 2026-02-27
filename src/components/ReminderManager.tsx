import React, { useState, useEffect } from 'react';
import { Bell, BellOff, Settings, RefreshCw } from 'lucide-react';
import ReminderTimeModal from './ReminderTimeModal';
import { supabase } from '../services/supabase';

const REMINDER_CONFIG_KEY = 'memorizakids_reminder_config';
const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY;

const ReminderManager = () => {
  const [permission, setPermission] = useState('default');
  const [isRequesting, setIsRequesting] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [reminderConfig, setReminderConfig] = useState(() => {
    const saved = localStorage.getItem(REMINDER_CONFIG_KEY);
    return saved ? JSON.parse(saved) : { hour: 9, minute: 0 };
  });

  useEffect(() => {
    if ('Notification' in window) {
      setPermission(Notification.permission);
      checkActiveSubscription();
      fetchReminderConfig();
    }
  }, []);

  const fetchReminderConfig = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('profiles')
        .select('reminder_hour, reminder_minute')
        .eq('id', user.id)
        .single();

      if (error) throw error;

      if (data && data.reminder_hour !== null) {
        const newConfig = { hour: data.reminder_hour, minute: data.reminder_minute };
        setReminderConfig(newConfig);
        localStorage.setItem(REMINDER_CONFIG_KEY, JSON.stringify(newConfig));
      }
    } catch (error) {
      console.error('Error fetching reminder config:', error);
    }
  };

  const checkActiveSubscription = async () => {
    if (!('serviceWorker' in navigator)) return;

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      if (subscription && Notification.permission === 'granted') {
        setPermission('granted');
      } else if (Notification.permission === 'granted' && !subscription) {
        // We have notification permission but no push subscription
        // This can happen if the SW was cleared or it's a new device
        console.log('Permission granted but no subscription found, will need to re-subscribe');
      }
    } catch (error) {
      console.error('Error checking subscription:', error);
    }
  };

  const urlBase64ToUint8Array = (base64String: string) => {
    if (!base64String) {
      throw new Error('VAPID public key is missing or empty');
    }
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  };

  const subscribeToPush = async () => {
    // Detect iOS
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone;

    if (isIOS && !isStandalone) {
      alert('Atenção: No iPhone/iPad, as notificações só funcionam se você adicionar o app à sua Tela de Início. \n\nClique no botão de Compartilhar (quadrado com seta) e escolha "Adicionar à Tela de Início" antes de ativar os lembretes.');
      return;
    }

    if (!VAPID_PUBLIC_KEY) {
      console.error('ERRO: VITE_VAPID_PUBLIC_KEY não está definida no arquivo .env');
      alert('Erro de configuração: Chave VAPID não encontrada. Por favor, reinicie o servidor de desenvolvimento.');
      return;
    }

    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      alert('Seu navegador não suporta notificações Push.');
      return;
    }

    try {
      setIsSubscribing(true);
      const registration = await navigator.serviceWorker.ready;

      // Request notification permission first
      const result = await Notification.requestPermission();
      setPermission(result);

      if (result !== 'granted') {
        throw new Error('Permissão negada para notificações');
      }

      // Subscribe to Push Service
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
      });

      // Save to Supabase
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { error } = await supabase
          .from('push_subscriptions')
          .upsert({
            user_id: user.id,
            subscription: subscription.toJSON()
          }, { onConflict: 'user_id, subscription' });

        if (error) throw error;
      } else {
        // If not logged in, we'll just keep it in the browser for now
        // But ideally we'd want users to be logged in to sync across devices
        console.warn('Usuário não logado. Inscrição de push apenas local no navegador.');
      }

      alert('Lembretes ativados com sucesso! ✅');
      setIsModalOpen(true);
    } catch (error) {
      console.error('Erro ao inscrever para push:', error);
      alert('Não foi possível ativar os lembretes. Verifique as permissões do navegador.');
    } finally {
      setIsSubscribing(false);
      setIsRequesting(false);
    }
  };

  const handleToggleReminders = () => {
    if (permission === 'default') {
      subscribeToPush();
    } else if (permission === 'granted') {
      setIsModalOpen(true);
    } else if (permission === 'denied') {
      alert('As notificações estão bloqueadas. Por favor, ative-as nas configurações do site.');
    }
  };

  const handleSaveTime = async (hour: number, minute: number) => {
    const newConfig = { hour, minute };

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { error } = await supabase
          .from('profiles')
          .update({
            reminder_hour: hour,
            reminder_minute: minute,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
          })
          .eq('id', user.id);

        if (error) throw error;
      }

      setReminderConfig(newConfig);
      localStorage.setItem(REMINDER_CONFIG_KEY, JSON.stringify(newConfig));
      setIsModalOpen(false);
      alert(`Ótimo! Agora você receberá lembretes todos os dias às ${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}.`);
    } catch (error) {
      console.error('Error updating notification preference:', error);
      alert('Horário salvo localmente, mas houve um erro ao sincronizar com o servidor.');
      // Still save locally
      setReminderConfig(newConfig);
      localStorage.setItem(REMINDER_CONFIG_KEY, JSON.stringify(newConfig));
      setIsModalOpen(false);
    }
  };

  const getButtonState = () => {
    if (isSubscribing) {
      return {
        Icon: RefreshCw,
        text: 'Ativando...',
        className: 'text-indigo-300 animate-spin',
      };
    }

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

  if (!('Notification' in window)) return null;

  const { Icon, text, className } = getButtonState();

  return (
    <>
      <button
        onClick={handleToggleReminders}
        disabled={permission === 'denied' || isSubscribing}
        className={`group text-sm font-medium flex items-center gap-3 w-full transition-all ${className}`}
        title={permission === 'granted' ? "Ajustar horário do lembrete" : ""}
      >
        <div className="relative flex-shrink-0">
          <Icon size={20} className={isSubscribing ? 'animate-spin' : ''} />
          {permission === 'granted' && (
            <div className="absolute -top-1 -right-1 bg-indigo-500 rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
              <Settings size={8} className="text-white" />
            </div>
          )}
        </div>
        <span className="font-medium">
          {permission === 'granted' ? `Lembretes · ${reminderConfig.hour.toString().padStart(2, '0')}:${reminderConfig.minute.toString().padStart(2, '0')}` : text}
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
