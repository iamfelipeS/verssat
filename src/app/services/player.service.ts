import { Injectable, signal } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Player } from '../models/player.model';

@Injectable({ providedIn: 'root' })
export class PlayerService {
  private supabaseUrl: string = 'https://jyiqaftpqikqqvfrojiu.supabase.co';
  private supabaseKey: string = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp5aXFhZnRwcWlrcXF2ZnJvaml1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQyMDM4MzUsImV4cCI6MjA1OTc3OTgzNX0.zn1sTE9DrWjSloORfCi67TLqfm1wM5SEtXzP7MIGBgU';
  private supabase = createClient(this.supabaseUrl, this.supabaseKey);
  private players = signal<Player[]>([]);

  async getPlayers() {
    const { data, error } = await this.supabase
      .from('players')
      .select('*');

    if (error) {
      console.error('Error fetching players:', error);
      return [];
    }
    return data;
  }

  getPlayersSignal() {
    return this.players.asReadonly(); // evita alterações externas
  }
  
  async loadPlayers() {
    const { data, error } = await this.supabase
      .from('players')
      .select('*');
  
    if (error) {
      console.error('Erro ao carregar jogadores:', error.message);
      this.players.set([]); // limpa se der erro
      return;
    }
  
    this.players.set(data || []);
  }
  

  async add(player: Player): Promise<void> {
    const { error } = await this.supabase
      .from('players')
      .insert([player]);

    if (error) {
      console.error('Erro ao adicionar jogador:', error.message);
    }
  }

  async update(player: Player): Promise<void> {
    const { error } = await this.supabase
      .from('players')
      .update(player)
      .eq('id', player.id);

    if (error) {
      console.error('Erro ao atualizar jogador:', error.message);
    }
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.supabase
      .from('players')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Erro ao excluir jogador:', error.message);
    }
  }

  async clearAll(): Promise<void> {
    const { error } = await this.supabase
      .from('players')
      .delete()
      .neq('id', '');

    if (error) {
      console.error('Erro ao limpar jogadores:', error.message);
    }
  }
}
