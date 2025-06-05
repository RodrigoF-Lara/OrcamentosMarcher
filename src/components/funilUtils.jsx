import React from 'react';
    import { ThermometerSnowflake, ThermometerSun, Flame, ThumbsUp, ThumbsDown, TrendingDown, CircleSlash, AlertTriangle } from 'lucide-react'; // Adicionado AlertTriangle

    export const etapasFunilConfig = {
      frio: { 
        label: 'Frio', 
        color: 'text-blue-600', 
        bgColor: 'bg-blue-100',
        borderColor: 'border-blue-300', // Adicionado para SelectTrigger
        icon: <ThermometerSnowflake className="h-4 w-4" />,
        description: 'Sem previsão de fechamento clara.'
      },
      morno: { 
        label: 'Morno', 
        color: 'text-orange-600', 
        bgColor: 'bg-orange-100',
        borderColor: 'border-orange-300', // Adicionado para SelectTrigger
        icon: <ThermometerSun className="h-4 w-4" />,
        description: 'Fechamento provável para o próximo mês.'
      },
      quente: { 
        label: 'Quente', 
        color: 'text-red-600', 
        bgColor: 'bg-red-100',
        borderColor: 'border-red-300', // Adicionado para SelectTrigger
        icon: <Flame className="h-4 w-4" />,
        description: 'Fechamento provável para o mês corrente.'
      },
      ganho: { 
        label: 'Ganho', 
        color: 'text-green-600', 
        bgColor: 'bg-green-100',
        borderColor: 'border-green-300', // Adicionado para SelectTrigger
        icon: <ThumbsUp className="h-4 w-4" />,
        description: 'Orçamento aprovado e negócio fechado.'
      },
      perdido: { 
        label: 'Perdido', 
        color: 'text-gray-700', 
        bgColor: 'bg-gray-200',
        borderColor: 'border-gray-400', // Adicionado para SelectTrigger
        icon: <CircleSlash className="h-4 w-4" />, 
        description: 'Negócio não fechado.'
      },
      default: {
        label: 'Não Definida',
        color: 'text-gray-500',
        bgColor: 'bg-gray-100',
        borderColor: 'border-gray-300', // Adicionado para SelectTrigger
        icon: <TrendingDown className="h-4 w-4" />,
        description: 'Etapa não especificada.'
      }
    };

    export const getEtapaFunilInfo = (etapaKey) => {
      return etapasFunilConfig[etapaKey] || etapasFunilConfig.default;
    };