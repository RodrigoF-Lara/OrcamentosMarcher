import React, { useState, useEffect } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export default function ClienteCombobox({ clientes, value, onChange, placeholder = "Selecione um cliente..." }) {
  const [open, setOpen] = useState(false);
  const [internalValue, setInternalValue] = useState(value);

  useEffect(() => {
    setInternalValue(value);
  }, [value]);

  const formatDisplayValue = (clienteId) => {
    const cliente = clientes.find((c) => c.id === clienteId);
    if (!cliente) return placeholder;
    let display = cliente.nome;
    if (cliente.estado && cliente.cidade) {
      display += ` - ${cliente.estado}/${cliente.cidade}`;
    } else if (cliente.cidade) {
      display += ` - ${cliente.cidade}`;
    } else if (cliente.estado) {
      display += ` - ${cliente.estado}`;
    }
    return display;
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between text-left font-normal h-10"
        >
          <span className="truncate">
            {internalValue ? formatDisplayValue(internalValue) : placeholder}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <Command
            filter={(value, search) => {
                const cliente = clientes.find(c => c.id === value);
                if (!cliente) return 0;
                const searchableText = `${cliente.nome} ${cliente.cidade} ${cliente.estado} ${cliente.cpf_cnpj} ${cliente.email}`.toLowerCase();
                if (searchableText.includes(search.toLowerCase())) return 1;
                return 0;
            }}
        >
          <CommandInput placeholder="Buscar cliente..." />
          <CommandList>
            <CommandEmpty>Nenhum cliente encontrado.</CommandEmpty>
            <CommandGroup>
              {clientes.map((cliente) => (
                <CommandItem
                  key={cliente.id}
                  value={cliente.id}
                  onSelect={(currentValue) => {
                    const selectedId = currentValue === internalValue ? "" : currentValue;
                    setInternalValue(selectedId);
                    onChange(selectedId); // Chama a função onChange do pai
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      internalValue === cliente.id ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <div>
                    <p className="font-medium">{cliente.nome}</p>
                    {(cliente.cidade || cliente.estado) && (
                       <p className="text-xs text-gray-500">
                         {cliente.cidade && cliente.estado ? `${cliente.cidade} - ${cliente.estado}` : cliente.cidade || cliente.estado}
                       </p>
                    )}
                    {cliente.cpf_cnpj && (
                        <p className="text-xs text-gray-500">{cliente.cpf_cnpj}</p>
                    )}
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}