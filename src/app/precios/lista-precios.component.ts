import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { MatIconRegistry } from '@angular/material';

import { LocalDataSource } from 'ng2-smart-table';

import { ProductosService } from '../services/productos.service';

@Component({
  selector: 'app-lista-precios',
  templateUrl: './lista-precios.component.html',
  styleUrls: ['./lista-precios.component.scss']
})
export class ListaPreciosComponent implements OnInit, OnDestroy {

  // Properties DataTableExport
  private columns: Object = {
    productoId:    { title: 'Cod. Producto', editable: false },
    descProducto:  { title: 'Descripcion', editable: false },
    precio:        {
      title: 'Precio',
      editable: false,
      type: 'html',
      valuePrepareFunction: (value) =>  `<div align="right">$ ${value.toFixed(2)}</div>` }
  };
  public settingsTable = {
    attr: { class: 'table' },
    actions: false,
    hideSubHeader: true,
    noDataMessage: '',
    columns: this.columns,
    pager: { display: false }
  };
  public sourceDataTable: LocalDataSource;

  public listaPrecios: any[];

  constructor(private _iconRegistry: MatIconRegistry,
              private _sanitizer: DomSanitizer,
              private productosService: ProductosService) {
  }

  public ngOnInit(): void {
    this.productosService.getListaPrecios(1)
      .subscribe(
        listaPrecios => {
          this.listaPrecios = listaPrecios;
          this.sourceDataTable = new LocalDataSource(this.listaPrecios);
        }
    );
  }

  public ngOnDestroy() {

  }
}
