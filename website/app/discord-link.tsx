"use client";
import { MessageCircle } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export function DiscordLink({ small=false, icon=false, black=false, light=false }: { small?:boolean; icon?:boolean; black?:boolean; light?:boolean }) {
  return <TooltipProvider delayDuration={120}><Tooltip><TooltipTrigger asChild>
    <a data-shrimp="discord" className={`button ${small?"small":""} ${black?"":"discord-shine shared-sheen"}`} href="https://discord.gg/u3HzCeKxV" target="_blank" rel="noreferrer">{icon && <MessageCircle size={20}/>}Join the Discord</a>
  </TooltipTrigger><TooltipContent data-shrimp="discord" className={`discord-tooltip ${light?"light-tooltip":""}`} side="bottom" sideOffset={12}>Discussions, upcoming events, polls, reading recommendations, study groups, project ideas, casual chats, etc.</TooltipContent></Tooltip></TooltipProvider>;
}
